import React from "react";
import { SupabaseClientContext } from "./SupabaseClientProvider";

export const useSupabaseClient = () => React.useContext(SupabaseClientContext);
