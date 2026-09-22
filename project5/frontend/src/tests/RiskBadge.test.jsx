import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskBadge from '../components/common/RiskBadge';

describe('RiskBadge Component', () => {
  it('renders Low risk badge correctly', () => {
    render(<RiskBadge category="Low" />);
    const badge = screen.getByText('Low Risk');
    expect(badge).toBeInTheDocument();
  });

  it('renders Critical risk badge correctly', () => {
    render(<RiskBadge category="Critical" />);
    const badge = screen.getByText('Critical Risk');
    expect(badge).toBeInTheDocument();
  });

  it('renders Medium risk badge correctly', () => {
    render(<RiskBadge category="Medium" />);
    const badge = screen.getByText('Medium Risk');
    expect(badge).toBeInTheDocument();
  });

  it('renders High risk badge correctly', () => {
    render(<RiskBadge category="High" />);
    const badge = screen.getByText('High Risk');
    expect(badge).toBeInTheDocument();
  });
});
