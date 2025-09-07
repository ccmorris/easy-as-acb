import { useAuthActions } from "@convex-dev/auth/react";
import { Github, LogOut } from "lucide-react";
import { Button } from "./ui";

export function SignInForm() {
  const { signIn } = useAuthActions();

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Sign In
      </h2>
      <div className="text-center">
        <Button
          onClick={() => void signIn("github")}
          variant="primary"
          size="lg"
          className="mx-auto"
          title="Sign in with GitHub"
        >
          <Github className="w-5 h-5" />
          Sign in with GitHub
        </Button>
      </div>
    </div>
  );
}

export function SignOutButton() {
  const { signOut } = useAuthActions();

  return (
    <Button
      onClick={() => signOut()}
      variant="danger"
      size="sm"
      title="Sign Out"
    >
      <LogOut className="w-4 h-4" />
    </Button>
  );
}
