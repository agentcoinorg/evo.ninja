import { AuthResponse, SupabaseClient } from "@supabase/supabase-js";
import cryptoServer from "crypto";

function getRandomUUID(){
  if (typeof window === "undefined"){
    return cryptoServer.randomBytes(16).toString('hex')
  }
  return crypto.randomUUID();
}

const generateGuestEmail = () => {
  return `guest-${getRandomUUID()}@evo.ninja-guest.com`
}

const passwordPattern: RegExp = /[a-zA-Z0-9_\-\+\.]/;

function getRandomByte(): number {
  const result = new Uint8Array(1);
  crypto.getRandomValues(result);
  return result[0];
}

function generateGuestPassword(length: number): string {
  return Array.from({ length }, () => {
    let result;
    while (true) {
      result = String.fromCharCode(getRandomByte());
      if (passwordPattern.test(result)) {
        return result;
      }
    }
  }).join('');
}

export const createGuestUser = async (supabase: SupabaseClient): Promise<AuthResponse> => {
  const guestEmail = generateGuestEmail()
  const guestPassword = generateGuestPassword(16)

  const response = await supabase.auth.signUp({
    email: guestEmail,
    password: guestPassword,
    options: {
      data: {
        is_guest: true
      }
    }
  })

  return response
}