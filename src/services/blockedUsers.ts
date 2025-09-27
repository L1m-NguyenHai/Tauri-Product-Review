// Tính năng block users tạm thời lưu vào localStorage
interface BlockedUser {
  userId: string;
  email: string;
  name: string;
  blockedAt: string;
  reason?: string;
}

const BLOCKED_USERS_KEY = "blocked-users";

class BlockedUsersService {
  async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const data = localStorage.getItem(BLOCKED_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading blocked users:", error);
      return [];
    }
  }

  async saveBlockedUsers(blockedUsers: BlockedUser[]): Promise<void> {
    try {
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
    } catch (error) {
      console.error("Error saving blocked users:", error);
      throw new Error("Failed to save blocked users");
    }
  }

  async isUserBlocked(userId: string, email: string): Promise<boolean> {
    const blockedUsers = await this.getBlockedUsers();
    return blockedUsers.some(
      (user) => user.userId === userId || user.email === email
    );
  }

  async blockUser(
    userId: string,
    email: string,
    name: string,
    reason?: string
  ): Promise<void> {
    const blockedUsers = await this.getBlockedUsers();

    // Check if user is already blocked
    const isAlreadyBlocked = blockedUsers.some(
      (user) => user.userId === userId || user.email === email
    );
    if (isAlreadyBlocked) {
      throw new Error("User is already blocked");
    }

    const newBlockedUser: BlockedUser = {
      userId,
      email,
      name,
      blockedAt: new Date().toISOString(),
      reason,
    };

    blockedUsers.push(newBlockedUser);
    await this.saveBlockedUsers(blockedUsers);
  }

  async unblockUser(userId: string): Promise<void> {
    const blockedUsers = await this.getBlockedUsers();
    const filteredUsers = blockedUsers.filter((user) => user.userId !== userId);
    await this.saveBlockedUsers(filteredUsers);
  }

  async getBlockedUserInfo(userId: string): Promise<BlockedUser | null> {
    const blockedUsers = await this.getBlockedUsers();
    return blockedUsers.find((user) => user.userId === userId) || null;
  }

  // Clear all blocked users (for testing)
  async clearAllBlocked(): Promise<void> {
    localStorage.removeItem(BLOCKED_USERS_KEY);
  }
}

export const blockedUsersService = new BlockedUsersService();
export type { BlockedUser };
