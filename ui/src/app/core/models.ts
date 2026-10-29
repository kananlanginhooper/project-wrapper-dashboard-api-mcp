import type { components } from './api-types';

/** One dashboard tab, as GET api/tabs returns it (generated from the API's OpenAPI: npm run api-types). */
export type Tab = components['schemas']['Tab'];
export type TabList = components['schemas']['TabList'];
