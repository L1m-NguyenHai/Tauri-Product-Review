
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { Star } from 'lucide-react';

interface EditableUserNameProps {
  name: string;
  isDark: boolean;
  email: string;
  role: string;
}

const EditableUserName: React.FC<EditableUserNameProps> = ({ name, isDark, email, role }) => {
  const { user, setUser } = useAuth() as any;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleClick = () => {
    setEditing(true);
    setShowConfirm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setShowConfirm(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setValue(name);
      setShowConfirm(false);
    }
  };

  const handleConfirm = async () => {
    if (!editing) return;
    if (!value.trim() || value === name) {
      setEditing(false);
      setValue(name);
      setShowConfirm(false);
      return;
    }
    setLoading(true);
    try {
      await userAPI.updateUserProfile({ name: value });
      if (user && setUser) {
        setUser({ ...user, name: value });
      }
      setEditing(false);
      setShowConfirm(false);
    } catch (error: any) {
      alert(error.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className={`text-3xl font-bold outline-none border-b-2 px-1 py-0.5 ${
              isDark ? 'bg-gray-800 text-white border-blue-500' : 'bg-white text-gray-900 border-blue-500'
            }`}
            maxLength={32}
            placeholder="Nhập tên mới"
            aria-label="Đổi tên"
          />
          {showConfirm && (
            <button
              onClick={handleConfirm}
              disabled={loading || !value.trim() || value === name}
              className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <span
            className="text-3xl font-bold cursor-pointer select-text"
            title="Click để đổi tên"
            onClick={handleClick}
          >
            {value}
          </span>
          <p className={`text-lg ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>{email}</p>
          {role === 'admin' && (
            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
              Admin
            </span>
          )}
          {role === 'reviewer' && (
            <span
              className="inline-flex items-center gap-1 mt-2 ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700"
            >
              <Star className="w-4 h-4 fill-blue-500 text-blue-500 mr-0.5" />
              Reviewer
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EditableUserName;