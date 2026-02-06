<template>
  <div class="accounts-form">
    <div class="accounts-form__header">
      <h2 class="accounts-form__title">Учетные записи</h2>
      <a-button type="primary" @click="addAccount">+</a-button>
    </div>

    <a-typography-text type="secondary" class="accounts-form__hint">
      Для указания нескольких меток для одной пары логин/пароль используйте разделитель
      <span class="accounts-form__hint-separator">;</span>
    </a-typography-text>

    <div class="accounts-form__list">
      <div
        v-for="row in rows"
        :key="row.id"
        class="accounts-form__row"
      >
        <div class="accounts-form__field accounts-form__field--label">
          <label class="accounts-form__label">Метки</label>
          <a-input
            v-model:value="row.rawLabels"
            :maxlength="50"
            :status="row.errors.labels ? 'error' : ''"
            placeholder="XXX; YYYYY"
            @blur="onBlurLabels(row)"
          />
        </div>

        <div class="accounts-form__field accounts-form__field--type">
          <label class="accounts-form__label">Тип записи</label>
          <a-select
            v-model:value="row.type"
            style="width: 140px"
            :options="typeOptions"
            @change="onChangeType(row)"
          />
        </div>

        <div class="accounts-form__field accounts-form__field--login">
          <label class="accounts-form__label">Логин</label>
          <a-input
            v-model:value="row.login"
            :maxlength="100"
            :status="row.errors.login ? 'error' : ''"
            placeholder="Значение"
            @blur="onBlurLogin(row)"
          />
        </div>

        <div
          v-if="row.type === 'LOCAL'"
          class="accounts-form__field accounts-form__field--password"
        >
          <label class="accounts-form__label">Пароль</label>
          <a-input-password
            v-model:value="row.password"
            :maxlength="100"
            :status="row.errors.password ? 'error' : ''"
            placeholder="Пароль"
            @blur="onBlurPassword(row)"
          />
        </div>

        <div class="accounts-form__field accounts-form__field--remove">
          <a-button type="text" danger @click="removeRow(row.id)">
            Удалить
          </a-button>
        </div>
      </div>

      <a-empty v-if="rows.length === 0" description="Нет учетных записей" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
import type { Account, AccountLabel, AccountType } from '../stores/accounts';
import { useAccountsStore } from '../stores/accounts';

interface RowState {
  id: string;
  rawLabels: string;
  type: AccountType;
  login: string;
  password: string;
  errors: {
    labels: boolean;
    login: boolean;
    password: boolean;
  };
}

const accountsStore = useAccountsStore();

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const rows = reactive<RowState[]>(
  accountsStore.accounts.map((acc) => ({
    id: acc.id,
    rawLabels: acc.rawLabels,
    type: acc.type,
    login: acc.login,
    password: acc.password ?? '',
    errors: {
      labels: false,
      login: false,
      password: false
    }
  }))
);

const typeOptions = computed(() => [
  { label: 'Локальная', value: 'LOCAL' as AccountType },
  { label: 'LDAP', value: 'LDAP' as AccountType }
]);

function addAccount() {
  rows.push({
    id: createId(),
    rawLabels: '',
    type: 'LOCAL',
    login: '',
    password: '',
    errors: {
      labels: false,
      login: false,
      password: false
    }
  });
}

function removeRow(id: string) {
  const index = rows.findIndex((r) => r.id === id);
  if (index !== -1) {
    rows.splice(index, 1);
    accountsStore.removeAccount(id);
  }
}

function parseLabels(raw: string): AccountLabel[] {
  return raw
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((text) => ({ text }));
}

function validateRow(row: RowState): boolean {
  row.errors.login = row.login.trim().length === 0;
  if (row.type === 'LOCAL') {
    row.errors.password = row.password.trim().length === 0;
  } else {
    row.errors.password = false;
  }

  return !row.errors.login && !row.errors.password;
}

function saveRow(row: RowState) {
  if (!validateRow(row)) {
    return;
  }

  const labels = parseLabels(row.rawLabels);

  const account: Account = {
    id: row.id,
    rawLabels: row.rawLabels,
    labels,
    type: row.type,
    login: row.login.trim(),
    password: row.type === 'LDAP' ? null : row.password
  };

  accountsStore.upsertAccount(account);
}

function onBlurLabels(row: RowState) {
  if (row.rawLabels.length > 50) {
    row.rawLabels = row.rawLabels.slice(0, 50);
  }
  saveRow(row);
}

function onBlurLogin(row: RowState) {
  if (row.login.length > 100) {
    row.login = row.login.slice(0, 100);
  }
  saveRow(row);
}

function onBlurPassword(row: RowState) {
  if (row.password.length > 100) {
    row.password = row.password.slice(0, 100);
  }
  saveRow(row);
}

function onChangeType(row: RowState) {
  if (row.type === 'LDAP') {
    row.password = '';
  }
  saveRow(row);
}
</script>

<style scoped>
.accounts-form {
  max-width: 1100px;
  margin: 40px auto;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
}

.accounts-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.accounts-form__title {
  margin: 0;
}

.accounts-form__hint {
  display: block;
  margin-bottom: 24px;
}

.accounts-form__hint-separator {
  font-weight: 600;
  margin-left: 4px;
}

.accounts-form__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.accounts-form__row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 2fr 2fr auto;
  gap: 12px;
  align-items: end;
}

.accounts-form__field {
  display: flex;
  flex-direction: column;
}

.accounts-form__label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 4px;
}

.accounts-form__field--remove {
  align-self: center;
}
</style>


