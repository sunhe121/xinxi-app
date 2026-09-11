import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { usersApi, familyApi, clearToken } from '@client/src/api';
import type { XinyuUser, FamilyMember, FamilyRelation, UpdateUserRequest } from '@shared/api.interface';

const RELATION_LABELS: Record<FamilyRelation, string> = {
  father: '爸爸',
  mother: '妈妈',
  grandfather: '爷爷',
  grandmother: '奶奶',
  son: '儿子',
  daughter: '女儿',
  spouse: '配偶',
  other: '家人',
};

export { RELATION_LABELS };

interface UserContextValue {
  user: XinyuUser | null;
  family: FamilyMember[];
  currentFamily: FamilyMember | null;
  loading: boolean;
  setUser: (u: XinyuUser | null) => void;
  setCurrentFamily: (f: FamilyMember | null) => void;
  refresh: () => void;
  refreshFamily: () => Promise<void>;
  editProfile: (data: UpdateUserRequest) => Promise<XinyuUser>;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<XinyuUser | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [currentFamily, setCurrentFamily] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await usersApi.getCurrentUser();
      setUser(userData);
      if (userData) {
        const familyData = await familyApi.getFamilyList();
        setFamily(familyData);
        setCurrentFamily(familyData[0] || null);
      }
    } catch {
      setUser(null);
      setFamily([]);
      setCurrentFamily(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshFamily = useCallback(async () => {
    try {
      const familyData = await familyApi.getFamilyList();
      setFamily(familyData);
      if (familyData.length > 0) {
        const stillExists = familyData.find((f) => f.id === currentFamily?.id);
        if (!stillExists) {
          setCurrentFamily(familyData[0]);
        }
      } else {
        setCurrentFamily(null);
      }
    } catch {
      setFamily([]);
      setCurrentFamily(null);
    }
  }, [currentFamily?.id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchUser();
  }, [fetchUser]);

  const editProfile = useCallback(async (data: UpdateUserRequest): Promise<XinyuUser> => {
    const updated = await usersApi.updateProfile(data);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setFamily([]);
    setCurrentFamily(null);
  }, []);

  return (
    <UserContext.Provider
      value={{ user, family, currentFamily, loading, setUser, setCurrentFamily, refresh, refreshFamily, editProfile, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    return {
      user: null,
      family: [],
      currentFamily: null,
      loading: true,
      setUser: () => {},
      setCurrentFamily: () => {},
      refresh: () => {},
      refreshFamily: async () => {},
      editProfile: async () => ({} as XinyuUser),
      logout: () => {},
    };
  }
  return ctx;
}
