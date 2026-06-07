import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@mrantidot/token';
const USER_KEY = '@mrantidot/user';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'technician' | 'admin';
  city?: string;
  rating?: number;
  jobsDone?: number;
  available?: boolean;
  createdAt?: string;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as StoredUser) : null;
}

export async function setUser(user: StoredUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function clearSession(): Promise<void> {
  await Promise.all([clearToken(), clearUser()]);
}
