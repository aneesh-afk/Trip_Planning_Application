import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Button from "../components/Button";
import Input from "../components/Input";

export default function Signup() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!displayName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("rate limit")) {
          setError(
            "Supabase has temporarily limited signup emails. Wait a while before trying again, or disable email confirmation in Supabase for this demo."
          );
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.session) {
        navigate("/dashboard");
      } else {
        setSuccess("Account created. Check your email to confirm your account.");
      }
    } catch {
      setError("Unable to create your account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] bg-surface rounded-md shadow-card p-10">
        <h1 className="font-display text-h1 text-ink mb-1">
          Create your account
        </h1>
        <p className="font-body text-small text-muted mb-8">
          Start planning trips in minutes.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="displayName"
            label="Name"
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && (
            <p className="font-body text-small text-danger -mt-1">{error}</p>
          )}
          {success && (
            <p className="font-body text-small text-horizon -mt-1">{success}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Creating account…" : "Sign Up"}
          </Button>
        </form>

        <p className="font-body text-small text-muted text-center mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-horizon font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
