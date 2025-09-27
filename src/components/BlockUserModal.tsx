import React, { useState } from "react";
import { Ban, UserCheck, X, AlertTriangle, User, Shield } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import type { User as UserType } from "../services/api";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onBlock: (user: UserType, reason?: string) => void;
  loading?: boolean;
}

interface UnblockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onUnblock: (userId: string, userName: string) => void;
  loading?: boolean;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onBlock,
  loading = false,
}) => {
  const { isDark } = useTheme();
  const [reason, setReason] = useState("");

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBlock(user, reason.trim() || undefined);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl ${
          isDark ? "bg-gray-800" : "bg-white"
        } animate-in fade-in-0 zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Block User
              </h2>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                This action will prevent the user from logging in
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 pb-4">
          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? "bg-red-900/10 border-red-800/30"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  isDark ? "bg-gray-700" : "bg-white"
                }`}
              >
                <User className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {user.name}
                </div>
                <div
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {user.email}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {user.role === "admin" && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </span>
                  )}
                  {user.role === "reviewer" && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Reviewer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {user.role === "admin" && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Warning: This user is an admin
                  </span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Admins cannot be blocked for security reasons
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6">
            <label
              htmlFor="reason"
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Reason for blocking (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for blocking this user..."
              className={`w-full px-3 py-3 rounded-lg border resize-none ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500"
              } focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors`}
              rows={3}
              maxLength={500}
              disabled={loading}
            />
            <div
              className={`text-right text-xs mt-1 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {reason.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 px-4 py-2.5 rounded-lg border font-medium transition-colors ${
                isDark
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || user.role === "admin"}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                user.role === "admin"
                  ? "bg-gray-400 cursor-not-allowed"
                  : loading
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Ban className="w-4 h-4" />
              )}
              {loading ? "Blocking..." : "Block User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UnblockUserModal: React.FC<UnblockUserModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  onUnblock,
  loading = false,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnblock(userId, userName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl ${
          isDark ? "bg-gray-800" : "bg-white"
        } animate-in fade-in-0 zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Unblock User
              </h2>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                This user will be able to log in again
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 pb-6">
          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? "bg-green-900/10 border-green-800/30"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  isDark ? "bg-gray-700" : "bg-white"
                }`}
              >
                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {userName}
                </div>
                <div
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Currently blocked
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation */}
        <div className="px-6 pb-4">
          <p
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Are you sure you want to unblock{" "}
            <span className="font-medium">{userName}</span>? They will
            immediately regain access to their account.
          </p>
        </div>

        {/* Actions */}
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg border font-medium transition-colors ${
                isDark
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                loading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {loading ? "Unblocking..." : "Unblock User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
