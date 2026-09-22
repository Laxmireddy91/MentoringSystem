// Real-time Messaging Acceptance Tests
// Run with: node scripts/realtime_test.js

const axios = require('axios');
const { io } = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const API = axios.create({ baseURL: `${BACKEND_URL}/api`, timeout: 10000 });

function logResult(name, passed, details = '') {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${details ? ' - ' + details : ''}`);
}

(async () => {
  try {
    // 1. Login Student and Mentor
    const studentCred = { email: 'st_msg1@test.com', password: 'Password@123' };
    const mentorCred = { email: 'm_msg1@test.com', password: 'Password@123' };
    const studentRes = await API.post('/auth/login', studentCred);
    const mentorRes = await API.post('/auth/login', mentorCred);
    const studentToken = studentRes.data.data.accessToken;
    const mentorToken = mentorRes.data.data.accessToken;
    logResult('LOGIN - Student', studentRes.status === 200);
    logResult('LOGIN - Mentor', mentorRes.status === 200);

    // 2. Connect sockets
    const studentSocket = io(BACKEND_URL, { auth: { token: studentToken } });
    const mentorSocket = io(BACKEND_URL, { auth: { token: mentorToken } });
    const events = { student: {}, mentor: {} };

    // Helper to capture events
    function capture(socket, role) {
      socket.on('presence:update', (data) => (events[role].presenceUpdate = data));
      socket.on('presence:snapshot', (data) => (events[role].presenceSnapshot = data));
      socket.on('message:ack', (data) => (events[role].messageAck = data));
      socket.on('message:new', (data) => (events[role].messageNew = data));
      socket.on('message:delivered', (data) => (events[role].messageDelivered = data));
      socket.on('message:read', (data) => (events[role].messageRead = data));
      socket.on('typing:status', (data) => (events[role].typingStatus = data));
    }
    capture(studentSocket, 'student');
    capture(mentorSocket, 'mentor');

    await Promise.all([
      new Promise((res) => studentSocket.once('connect', res)),
      new Promise((res) => mentorSocket.once('connect', res)),
    ]);

    // Presence request from Student
    studentSocket.emit('presence:request');
    await new Promise((r) => setTimeout(r, 500)); // wait for response
    const presenceOk = events.student.presenceSnapshot && events.mentor.presenceUpdate;
    logResult('PRESENCE - Snapshot', !!events.student.presenceSnapshot);
    logResult('PRESENCE - Update broadcast', !!events.mentor.presenceUpdate);

    // 2. Real-time message exchange
    const testMessageStudent = 'TEST-STUDENT-001';
    const testMessageMentor = 'TEST-MENTOR-001';
    // Student sends message via REST (which triggers socket emit)
    const sendRes = await API.post('/messages', {
      receiverId: mentorRes.data.data.user._id,
      content: testMessageStudent,
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    logResult('MESSAGE - Student send via API', sendRes.status === 201);
    // Wait for mentor to receive message:new
    await new Promise((r) => setTimeout(r, 500));
    const mentorGot = events.mentor.messageNew && events.mentor.messageNew.content === testMessageStudent;
    logResult('MESSAGE - Mentor receives in real-time', mentorGot);

    // Mentor replies
    const sendRes2 = await API.post('/messages', {
      receiverId: studentRes.data.data.user._id,
      content: testMessageMentor,
    }, { headers: { Authorization: `Bearer ${mentorToken}` } });
    logResult('MESSAGE - Mentor send via API', sendRes2.status === 201);
    await new Promise((r) => setTimeout(r, 500));
    const studentGot = events.student.messageNew && events.student.messageNew.content === testMessageMentor;
    logResult('MESSAGE - Student receives reply', studentGot);

    // 3. Delivery / Read acknowledgments
    const msgId = events.mentor.messageNew._id;
    // Mentor acknowledges delivery (simulated by API call that triggers socket)
    const deliveryRes = await API.post(`/messages/${msgId}/delivered`, {}, { headers: { Authorization: `Bearer ${mentorToken}` } });
    logResult('DELIVERY - Mentor marks delivered', deliveryRes.status === 200);
    await new Promise((r) => setTimeout(r, 300));
    const studentDelAck = events.student.messageDelivered && events.student.messageDelivered.messageId === msgId;
    logResult('DELIVERY - Student receives delivered ack', !!studentDelAck);

    // Mentor marks read
    const readRes = await API.post(`/messages/${msgId}/read`, {}, { headers: { Authorization: `Bearer ${mentorToken}` } });
    logResult('READ - Mentor marks read', readRes.status === 200);
    await new Promise((r) => setTimeout(r, 300));
    const studentReadAck = events.student.messageRead && events.student.messageRead.messageId === msgId;
    logResult('READ - Student receives read ack', !!studentReadAck);

    // 4. Typing indicator
    studentSocket.emit('typing:start', { conversationId: events.mentor.messageNew.conversationId });
    await new Promise((r) => setTimeout(r, 300));
    const typingStart = events.mentor.typingStatus && events.mentor.typingStatus.isTyping;
    logResult('TYPING - Mentor sees start', !!typingStart);
    studentSocket.emit('typing:stop', { conversationId: events.mentor.messageNew.conversationId });
    await new Promise((r) => setTimeout(r, 300));
    const typingStop = events.mentor.typingStatus && !events.mentor.typingStatus.isTyping;
    logResult('TYPING - Mentor sees stop', !!typingStop);

    // 5. Presence multi-tab simulation
    const secondStudentSocket = io(BACKEND_URL, { auth: { token: studentToken } });
    await new Promise((r) => secondStudentSocket.once('connect', r));
    // Close first socket, ensure presence remains online via snapshot from mentor
    studentSocket.disconnect();
    await new Promise((r) => setTimeout(r, 500));
    mentorSocket.emit('presence:request');
    await new Promise((r) => setTimeout(r, 300));
    const stillOnline = events.mentor.presenceSnapshot && events.mentor.presenceSnapshot.find(u => u.userId === studentRes.data.data.user._id && u.online);
    logResult('PRESENCE - Multi-tab remains online after one disconnect', !!stillOnline);
    // Close second socket
    secondStudentSocket.disconnect();
    await new Promise((r) => setTimeout(r, 500));
    mentorSocket.emit('presence:request');
    await new Promise((r) => setTimeout(r, 300));
    const nowOffline = events.mentor.presenceSnapshot && events.mentor.presenceSnapshot.find(u => u.userId === studentRes.data.data.user._id && !u.online);
    logResult('PRESENCE - Offline after all sockets closed', !!nowOffline);

    // 6. Unread count test using API
    // Ensure no unread messages initially
    const unreadBefore = await API.get(`/messages/unread-count/${mentorRes.data.data.user._id}`, { headers: { Authorization: `Bearer ${studentToken}` } });
    logResult('UNREAD - Initial count 0', unreadBefore.data.data.unreadCount === 0);
    // Send two messages from student to mentor (already sent one, send another)
    await API.post('/messages', { receiverId: mentorRes.data.data.user._id, content: 'msg2' }, { headers: { Authorization: `Bearer ${studentToken}` } });
    await API.post('/messages', { receiverId: mentorRes.data.data.user._id, content: 'msg3' }, { headers: { Authorization: `Bearer ${studentToken}` } });
    const unreadAfter = await API.get(`/messages/unread-count/${mentorRes.data.data.user._id}`, { headers: { Authorization: `Bearer ${mentorToken}` } });
    const countAfter = unreadAfter.data.data.unreadCount;
    logResult('UNREAD - After two messages', countAfter === 2);
    // Mentor reads conversation (GET messages) which should reset count
    await API.get(`/messages/user/${studentRes.data.data.user._id}`, { headers: { Authorization: `Bearer ${mentorToken}` } });
    const unreadReset = await API.get(`/messages/unread-count/${mentorRes.data.data.user._id}`, { headers: { Authorization: `Bearer ${mentorToken}` } });
    logResult('UNREAD - After opening conversation count 0', unreadReset.data.data.unreadCount === 0);

    // Cleanup sockets
    mentorSocket.disconnect();
  } catch (err) {
    console.error('ERROR during acceptance tests', err);
    process.exit(1);
  }
})();
