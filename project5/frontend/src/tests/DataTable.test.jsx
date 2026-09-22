import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../components/common/DataTable';

describe('DataTable Component', () => {
  const sampleColumns = [
    { header: 'Name', accessorKey: 'name', sortable: true },
    { header: 'CGPA', accessorKey: 'cgpa', sortable: true },
  ];

  const sampleData = [
    { _id: '1', name: 'Alice Smith', cgpa: 9.2 },
    { _id: '2', name: 'Bob Jones', cgpa: 7.5 },
    { _id: '3', name: 'Charlie Brown', cgpa: 8.4 },
  ];

  it('renders table headers and row items', () => {
    render(<DataTable columns={sampleColumns} data={sampleData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('CGPA')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('displays empty state when no data provided', () => {
    render(<DataTable columns={sampleColumns} data={[]} emptyMessage="No students found" />);
    expect(screen.getByText('No students found')).toBeInTheDocument();
  });

  it('filters data by search query', () => {
    render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        searchQuery="Alice"
        searchKeys={['name']}
      />
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });

  it('handles row click callback', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={sampleColumns} data={sampleData} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('Alice Smith'));
    expect(onRowClick).toHaveBeenCalledWith(sampleData[0]);
  });
});
