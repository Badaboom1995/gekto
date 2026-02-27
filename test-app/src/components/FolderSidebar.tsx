import React, { useState } from 'react';

interface FolderSidebarProps {
  folders: { id: string; name: string }[];
  selectedFolder: string | null;
  onSelectFolder: (id: string | null) => void;
  onAddFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onAddFolder,
  onDeleteFolder,
}) => {
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onAddFolder(trimmed);
      setNewFolderName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddFolder();
    }
  };

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: '#1e293b', // slate-800
    color: '#f3f4f6', // gray-100
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '200px',
    height: '100%',
  };

  const folderRowStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#475569' : 'transparent', // slate-600 when selected
    transition: 'background-color 0.15s ease',
  });

  const folderNameStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const deleteButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#9ca3af', // gray-400
    cursor: 'pointer',
    padding: '2px 6px',
    fontSize: '14px',
    borderRadius: '4px',
    marginLeft: '8px',
  };

  const addFormStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #374151', // gray-700
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #4b5563', // gray-600
    backgroundColor: '#334155', // slate-700
    color: '#f3f4f6', // gray-100
    fontSize: '14px',
    outline: 'none',
  };

  const addButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#6b7280', // gray-500
    color: '#f9fafb', // gray-50
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  };

  return (
    <div style={sidebarStyle}>
      {/* All folders entry */}
      <div
        style={folderRowStyle(selectedFolder === null)}
        onClick={() => onSelectFolder(null)}
        onMouseEnter={(e) => {
          if (selectedFolder !== null) {
            e.currentTarget.style.backgroundColor = '#334155'; // slate-700
          }
        }}
        onMouseLeave={(e) => {
          if (selectedFolder !== null) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <span style={folderNameStyle}>All</span>
      </div>

      {/* Folder list */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          style={folderRowStyle(selectedFolder === folder.id)}
          onClick={() => onSelectFolder(folder.id)}
          onMouseEnter={(e) => {
            if (selectedFolder !== folder.id) {
              e.currentTarget.style.backgroundColor = '#334155'; // slate-700
            }
          }}
          onMouseLeave={(e) => {
            if (selectedFolder !== folder.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={folderNameStyle}>{folder.name}</span>
          <button
            style={deleteButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder.id);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4b5563'; // gray-600
              e.currentTarget.style.color = '#f3f4f6'; // gray-100
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af'; // gray-400
            }}
            title="Delete folder"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add folder form */}
      <div style={addFormStyle}>
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New folder..."
          style={inputStyle}
        />
        <button
          onClick={handleAddFolder}
          style={addButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563'; // gray-600
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280'; // gray-500
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default FolderSidebar;
