interface AppConfig {
  apiBaseUrl: string;
  useMockData: boolean;
}

type EnvKey = keyof Pick<ImportMetaEnv, 'VITE_API_BASE_URL' | 'VITE_USE_MOCK_DATA'>;

const defaultConfig = {
  developmentApiBaseUrl: 'http://localhost:4000',
  productionApiBaseUrl: 'https://i74640i5ab.execute-api.us-west-2.amazonaws.com',
  useMockData: false,
} as const;

const readStringEnv = (key: EnvKey, fallback: string): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};

const readBooleanEnv = (key: EnvKey, fallback: boolean): boolean => {
  const value = import.meta.env[key];

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
};

const normalizeBaseUrl = (baseUrl: string): string => {
  return baseUrl.replace(/\/+$/, '');
};

export const appConfig: AppConfig = Object.freeze({
  apiBaseUrl: normalizeBaseUrl(
    readStringEnv(
      'VITE_API_BASE_URL',
      import.meta.env.PROD
        ? defaultConfig.productionApiBaseUrl
        : defaultConfig.developmentApiBaseUrl,
    ),
  ),
  useMockData: readBooleanEnv('VITE_USE_MOCK_DATA', defaultConfig.useMockData),
});
