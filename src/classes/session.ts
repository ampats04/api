import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";;
import { ErrorTypes, AuthType } from "../types/enums";
import { generateToken } from "../utils/security";
import { Log } from "../utils/log";

/**
 * Session class
 * @author mavyfaby (Maverick Fabroa)
 */
export class Session {
  /**
   * Get student ID from jwt session
   */
  static async getSession(request: Request | string, callback: (error: ErrorTypes | null, data: SessionData | null, newToken?: string) => void) {
    // Default token
    let token = typeof request === 'string' ? request : '';

    // If request is a Request object
    if (typeof request !== 'string') {
      // Get authorization header
      const authorization = request.headers.authorization;
  
      // If authorization header is not present
      if (!authorization) {
        callback(null, { id: "" });
        return; 
      }
  
      // Get token
      token = authorization.split(' ')[1];
    }

    // If using API key
    if (token === process.env.API_KEY) {
      Log.i("Using API KEY");
      callback(null, { id: "API_KEY", role: AuthType.ADMIN });
      return;
    }

    // Decode secret key
    const secret = new TextEncoder().encode(process.env.SECRET_KEY);
    // New token
    let newToken: string | undefined;

    try {
      // Verify and Get data
      const payload = (await jwtVerify(token, secret, { algorithms: ['HS256'] })).payload;
      // Get ID
      const id = payload.id as string;

      if (payload.exp) {
        const now = new Date();
        const exp = new Date(Number(payload.exp + "000"));
        const hoursLeft = Math.floor((exp.getTime() - now.getTime()) / 1000 / 60 / 60);

        // If token is halfway to be expired
        if (hoursLeft <= 12) {
          // Generate new token to refresh the session
          newToken = await new SignJWT({ id, jti: generateToken(6) })
            .setProtectedHeader({ alg: 'HS256', typ: "JWT" })
            .setExpirationTime('1d')
            .sign(secret);

          Log.i("New token generated for student #" + id,  true);
        }
      }

      // Get role
      const role = id.startsWith("S") ? AuthType.STUDENT : id.startsWith("A") ? AuthType.ADMIN : undefined;
      // Verify token
      callback(null, { id: id.split("-")[1], role }, newToken);
    } catch (e: any) {
      // Log error
      console.error(e.code);
      // If session expired
      callback(ErrorTypes.DB_EXPIRED, null);
    }
  }
}