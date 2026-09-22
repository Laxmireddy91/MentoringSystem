import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FaqChatbot from '../components/chatbot/FaqChatbot';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () {};

describe('FaqChatbot Component', () => {
  it('renders closed floating launcher button by default', () => {
    render(<FaqChatbot />);
    expect(screen.getByText('Ask MentorBot')).toBeInTheDocument();
  });

  it('opens chat window on clicking launcher button', () => {
    render(<FaqChatbot />);
    const launcher = screen.getByText('Ask MentorBot');
    fireEvent.click(launcher);
    expect(screen.getByText('MentorBot Assistant')).toBeInTheDocument();
  });

  it('displays quick suggestion chips', () => {
    render(<FaqChatbot />);
    fireEvent.click(screen.getByText('Ask MentorBot'));
    expect(screen.getByText('📊 CIE Formula')).toBeInTheDocument();
    expect(screen.getByText('🎓 SGPA / CGPA')).toBeInTheDocument();
  });
});
