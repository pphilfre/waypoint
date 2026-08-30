/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applications from "../applications.js";
import type * as companies from "../companies.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as dataExchange from "../dataExchange.js";
import type * as favicon from "../favicon.js";
import type * as opportunities from "../opportunities.js";
import type * as ratings from "../ratings.js";
import type * as savedViews from "../savedViews.js";
import type * as trash from "../trash.js";
import type * as url from "../url.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applications: typeof applications;
  companies: typeof companies;
  contacts: typeof contacts;
  crons: typeof crons;
  dataExchange: typeof dataExchange;
  favicon: typeof favicon;
  opportunities: typeof opportunities;
  ratings: typeof ratings;
  savedViews: typeof savedViews;
  trash: typeof trash;
  url: typeof url;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
