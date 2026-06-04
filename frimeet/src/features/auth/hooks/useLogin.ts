import { useMutation } from "@tanstack/react-query";
import { LoginFormData } from "../schemas/loginSchema";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      // TODO: Replace with actual API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, ...data });
        }, 1000);
      });
    },
  });
};
