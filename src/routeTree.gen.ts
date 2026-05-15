/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically // You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as SignupRouteImport } from './routes/signup'
import { Route as LoginRouteImport } from './routes/login'
import { Route as AuthenticatedRouteImport } from './routes/_authenticated'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthenticatedUsersRouteImport } from './routes/_authenticated/users'
import { Route as AuthenticatedSalesRouteImport } from './routes/_authenticated/sales'
import { Route as AuthenticatedProductsRouteImport } from './routes/_authenticated/products'
import { Route as AuthenticatedPosRouteImport } from './routes/_authenticated/pos'
import { Route as AuthenticatedDashboardRouteImport } from './routes/_authenticated/dashboard'
import { Route as AuthenticatedCustomersRouteImport } from './routes/_authenticated/customers'

const SignupRoute = SignupRouteImport.update({
  id: '/signup',
  path: '/signup',
  getParentRoute: () => rootRouteImport,
} as any)
const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedRoute = AuthenticatedRouteImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedUsersRoute = AuthenticatedUsersRouteImport.update({
  id: '/users',
  path: '/users',
  getParentRoute: () => AuthenticatedRoute,
} as any)
const AuthenticatedSalesRoute = AuthenticatedSalesRouteImport.update({
  id: '/sales',
  path: '/sales',
  getParentRoute: () => AuthenticatedRoute,
} as any)
const AuthenticatedProductsRoute = AuthenticatedProductsRouteImport.update({
  id: '/products',
  path: '/products',
  getParentRoute: () => AuthenticatedRoute,
} as any)
const AuthenticatedPosRoute = AuthenticatedPosRouteImport.update({
  id: '/pos',
  path: '/pos',
  getParentRoute: () => AuthenticatedRoute,
} as any)
const AuthenticatedDashboardRoute = AuthenticatedDashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => AuthenticatedRoute,
} as any)
const AuthenticatedCustomersRoute = AuthenticatedCustomersRouteImport.update({
  id: '/customers',
  path: '/customers',
  getParentRoute: () => AuthenticatedRoute,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/signup': typeof SignupRoute
  '/customers': typeof AuthenticatedCustomersRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/pos': typeof AuthenticatedPosRoute
  '/products': typeof AuthenticatedProductsRoute
  '/sales': typeof AuthenticatedSalesRoute
  '/users': typeof AuthenticatedUsersRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/signup': typeof SignupRoute
  '/customers': typeof AuthenticatedCustomersRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/pos': typeof AuthenticatedPosRoute
  '/products': typeof AuthenticatedProductsRoute
  '/sales': typeof AuthenticatedSalesRoute
  '/users': typeof AuthenticatedUsersRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteWithChildren
  '/login': typeof LoginRoute
  '/signup': typeof SignupRoute
  '/_authenticated/customers': typeof AuthenticatedCustomersRoute
  '/_authenticated/dashboard': typeof AuthenticatedDashboardRoute
  '/_authenticated/pos': typeof AuthenticatedPosRoute
  '/_authenticated/products': typeof AuthenticatedProductsRoute
  '/_authenticated/sales': typeof AuthenticatedSalesRoute
  '/_authenticated/users': typeof AuthenticatedUsersRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/login'
    | '/signup'
    | '/customers'
    | '/dashboard'
    | '/pos'
    | '/products'
    | '/sales'
    | '/users'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/login'
    | '/signup'
    | '/customers'
    | '/dashboard'
    | '/pos'
    | '/products'
    | '/sales'
    | '/users'
  id:
    | '__root__'
    | '/'
    | '/_authenticated'
    | '/login'
    | '/signup'
    | '/_authenticated/customers'
    | '/_authenticated/dashboard'
    | '/_authenticated/pos'
    | '/_authenticated/products'
    | '/_authenticated/sales'
    | '/_authenticated/users'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthenticatedRoute: typeof AuthenticatedRouteWithChildren
  LoginRoute: typeof LoginRoute
  SignupRoute: typeof SignupRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/signup': {
      id: '/signup'
      path: '/signup'
      fullPath: '/signup'
      preLoaderRoute: typeof SignupRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: '/'
      preLoaderRoute: typeof AuthenticatedRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated/users': {
      id: '/_authenticated/users'
      path: '/users'
      fullPath: '/users'
      preLoaderRoute: typeof AuthenticatedUsersRouteImport
      parentRoute: typeof AuthenticatedRoute
    }
    '/_authenticated/sales': {
      id: '/_authenticated/sales'
      path: '/sales'
      fullPath: '/sales'
      preLoaderRoute: typeof AuthenticatedSalesRouteImport
      parentRoute: typeof AuthenticatedRoute
    }
    '/_authenticated/products': {
      id: '/_authenticated/products'
      path: '/products'
      fullPath: '/products'
      preLoaderRoute: typeof AuthenticatedProductsRouteImport
      parentRoute: typeof AuthenticatedRoute
    }
    '/_authenticated/pos': {
      id: '/_authenticated/pos'
      path: '/pos'
      fullPath: '/pos'
      preLoaderRoute: typeof AuthenticatedPosRouteImport
      parentRoute: typeof AuthenticatedRoute
    }
    '/_authenticated/dashboard': {
      id: '/_authenticated/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof AuthenticatedDashboardRouteImport
      parentRoute: typeof AuthenticatedRoute
    }
    '/_authenticated/customers': {
      id: '/_authenticated/customers'
      path: '/customers'
      fullPath: '/customers'
      preLoaderRoute: typeof AuthenticatedCustomersRouteImport
      parentRoute: typeof AuthenticatedRoute
    }
  }
}

interface AuthenticatedRouteChildren {
  AuthenticatedCustomersRoute: typeof AuthenticatedCustomersRoute
  AuthenticatedDashboardRoute: typeof AuthenticatedDashboardRoute
  AuthenticatedPosRoute: typeof AuthenticatedPosRoute
  AuthenticatedProductsRoute: typeof AuthenticatedProductsRoute
  AuthenticatedSalesRoute: typeof AuthenticatedSalesRoute
  AuthenticatedUsersRoute: typeof AuthenticatedUsersRoute
}

const AuthenticatedRouteChildren: AuthenticatedRouteChildren = {
  AuthenticatedCustomersRoute: AuthenticatedCustomersRoute,
  AuthenticatedDashboardRoute: AuthenticatedDashboardRoute,
  AuthenticatedPosRoute: AuthenticatedPosRoute,
  AuthenticatedProductsRoute: AuthenticatedProductsRoute,
  AuthenticatedSalesRoute: AuthenticatedSalesRoute,
  AuthenticatedUsersRoute: AuthenticatedUsersRoute,
}

const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren,
)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  LoginRoute: LoginRoute,
  SignupRoute: SignupRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
