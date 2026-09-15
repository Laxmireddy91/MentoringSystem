const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/**
 * Common API request handler
 */
async function request(
  endpoint,
  options = {}
) {
  const token = localStorage.getItem(
    "mentorconnect_token"
  );

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : {
          "Content-Type":
            "application/json",
        }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw new Error(
      "Unable to connect to the backend. Make sure the backend server is running on port 5000."
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401 && endpoint !== "/auth/refresh") {
      const refreshToken = localStorage.getItem("mentorconnect_refresh_token");
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshed = await refreshResponse.json();
          if (refreshResponse.ok && refreshed.token) {
            localStorage.setItem("mentorconnect_token", refreshed.token);
            if (refreshed.user) localStorage.setItem("mentorconnect_user", JSON.stringify(refreshed.user));
            headers.Authorization = `Bearer ${refreshed.token}`;
            response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
            data = await response.json().catch(() => ({}));
            if (response.ok) return data;
          }
        } catch {}
      }
      localStorage.removeItem("mentorconnect_token");
      localStorage.removeItem("mentorconnect_refresh_token");
      localStorage.removeItem("mentorconnect_user");
    }

    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }

  return data;
}


/**
 * GET
 */
async function get(endpoint) {
  return request(endpoint, {
    method: "GET",
  });
}


/**
 * POST
 */
async function post(
  endpoint,
  body = {}
) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}


/**
 * PUT
 */
async function put(
  endpoint,
  body = {}
) {
  return request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}


/**
 * DELETE
 */
async function del(endpoint) {
  return request(endpoint, {
    method: "DELETE",
  });
}


/**
 * Upload / FormData
 */
async function upload(
  endpoint,
  formData
) {
  return request(endpoint, {
    method: "POST",
    body: formData,
  });
}


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const api = {

  get,

  post,

  put,

  delete: del,

  upload,


  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  auth: {

    login: (credentials) =>
      post(
        "/auth/login",
        credentials
      ),

    register: (userData) =>
      post(
        "/auth/register",
        userData
      ),

    me: () => get("/auth/me"),
    refresh: (refreshToken) => post("/auth/refresh", { refreshToken }),
    forgotPassword: (email) => post("/auth/forgot-password", { email }),
    resetPassword: (token, password) => post("/auth/reset-password", { token, password }),
    verifyEmail: (token) => get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
    resendVerification: (email) => post("/auth/resend-verification", { email }),
    verifyLogin2FA: (challenge, code) => post("/auth/login/2fa", { challenge, code }),
    activity: () => get("/auth/activity"),
    setup2FA: () => post("/auth/2fa/setup"),
    verify2FA: (code) => post("/auth/2fa/verify", { code }),
    disable2FA: () => post("/auth/2fa/disable"),
    auditLogs: () => get("/auth/audit-logs"),
  },


  /*
  |--------------------------------------------------------------------------
  | Workspace
  |--------------------------------------------------------------------------
  */

  workspace: {

    dashboard: () =>
      get(
        "/workspace/dashboard"
      ),

    analytics: () =>
      get(
        "/workspace/analytics"
      ),
  },


  /*
  |--------------------------------------------------------------------------
  | Students
  |--------------------------------------------------------------------------
  */

  students: {

    getAll: () =>
      get(
        "/workspace/dashboard"
      ),

    create: (student) =>
      post(
        "/workspace/students",
        student
      ),

    update: (
      id,
      student
    ) =>
      put(
        `/workspace/students/${id}`,
        student
      ),

    delete: (id) =>
      del(
        `/workspace/students/${id}`
      ),

    updateSubjects: (
      id,
      subjects
    ) =>
      put(
        `/workspace/students/${id}/subjects`,
        {
          subjects,
        }
      ),

    updatePerformanceReport: (
      id,
      report
    ) =>
      put(
        `/workspace/students/${id}/performance-report`,
        report
      ),

    getAchievements: (id) =>
      get(
        `/workspace/students/${id}/achievements`
      ),

    uploadAchievement: (id, achievement) =>
      upload(`/workspace/students/${id}/achievements`, achievement),

    deleteAchievement: (
      id,
      achievementId
    ) =>
      del(
        `/workspace/students/${id}/achievements/${achievementId}`
      ),
  },


  /*
  |--------------------------------------------------------------------------
  | Mentors
  |--------------------------------------------------------------------------
  */

  mentors: {

    create: (mentor) =>
      post(
        "/workspace/mentors",
        mentor
      ),

    update: (
      id,
      mentor
    ) =>
      put(
        `/workspace/mentors/${id}`,
        mentor
      ),

    delete: (id) =>
      del(
        `/workspace/mentors/${id}`
      ),
  },


  /*
  |--------------------------------------------------------------------------
  | Mentoring Sessions
  |--------------------------------------------------------------------------
  */

  sessions: {

    create: (session) =>
      post(
        "/workspace/sessions",
        session
      ),

    update: (
      id,
      session
    ) =>
      put(
        `/workspace/sessions/${id}`,
        session
      ),

    delete: (id) =>
      del(
        `/workspace/sessions/${id}`
      ),
  },


  /*
  |--------------------------------------------------------------------------
  | Notifications
  |--------------------------------------------------------------------------
  */

  notifications: {

    markRead: (id) =>
      put(
        `/workspace/notifications/${id}/read`
      ),
  },


  /*
  |--------------------------------------------------------------------------
  | Tasks
  |--------------------------------------------------------------------------
  */

  tasks: {

    create: (task) =>
      post(
        "/workspace/tasks",
        task
      ),

    update: (
      id,
      task
    ) =>
      put(
        `/workspace/tasks/${id}`,
        task
      ),

    delete: (id) =>
      del(
        `/workspace/tasks/${id}`
      ),
  },


  /*
  |--------------------------------------------------------------------------
  | Profiles
  |--------------------------------------------------------------------------
  */

  profiles: {

    update: (
      role,
      profile
    ) =>
      put(
        `/workspace/profiles/${role}`,
        profile
      ),
  },

  /**
   * AI Student Risk Analysis
   */
  risk: {
    allStudents: () =>
      get("/risk/students"),

    student: (id) =>
      get(`/risk/students/${id}`),
  },
};


export default api;