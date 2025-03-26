import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      /** The user's DB id. */
      id: string
      /** The user's organization ID. */
      organizationId: string
      /** The user's roles. */
      roles?: string[]
      /** The user's department ID. */
      departmentId?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** The user's DB id. */
    id: string
    /** The user's organization ID. */
    organizationId: string
    /** The user's roles. */
    roles?: string[]
    /** The user's department ID. */
    departmentId?: string
  }
}
