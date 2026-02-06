import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AccountType = 'LDAP' | 'LOCAL';

export interface AccountLabel {
  text: string;
}

export interface Account {
  id: string;
  labels: AccountLabel[]; // parsed from raw labels string
  rawLabels: string; // for displaying in input
  type: AccountType;
  login: string;
  password: string | null;
}

const STORAGE_KEY = 'accounts-store';

function loadInitialState(): Account[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Account[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>(loadInitialState());

  function saveToStorage() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.value));
  }

  function upsertAccount(account: Account) {
    const index = accounts.value.findIndex((a: Account) => a.id === account.id);
    if (index === -1) {
      accounts.value.push(account);
    } else {
      accounts.value.splice(index, 1, account);
    }
    saveToStorage();
  }

  function removeAccount(id: string) {
    accounts.value = accounts.value.filter((a: Account) => a.id !== id);
    saveToStorage();
  }

  return {
    accounts,
    saveToStorage,
    upsertAccount,
    removeAccount
  };
});




