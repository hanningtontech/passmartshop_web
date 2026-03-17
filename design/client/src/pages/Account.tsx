import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Mode = "login" | "register";

export default function Account() {
  const { user, profile, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, updateProfile, deleteAccount, signOut } =
    useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocationField] = useState(profile?.location ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      toast.error("Please fill in email, username and password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setSaving(true);
      await signUpWithEmail({
        email,
        password,
        username,
        displayName: displayName || undefined,
        phoneNumber: phoneNumber || undefined,
        location: location || undefined,
        address: address || undefined,
      });
      toast.success("Account created successfully.");
      setLocation("/account");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    try {
      setSaving(true);
      await signInWithEmail(email, password);
      toast.success("Signed in successfully.");
      setLocation("/account");
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign in.");
    } finally {
      setSaving(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setSaving(true);
      await signInWithGoogle();
      toast.success("Signed in with Google.");
      setLocation("/account");
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        username: username || profile?.username || null,
        displayName: displayName || profile?.displayName || null,
        phoneNumber: phoneNumber || profile?.phoneNumber || null,
        location: location || profile?.location || null,
        address: address || profile?.address || null,
      });
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      return;
    }
    try {
      setDeleting(true);
      await deleteAccount();
      toast.success("Account deleted.");
      setLocation("/");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-600">Loading account...</p>
      </div>
    );
  }

  if (user && profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Your Account</h1>

          <p className="mb-4 text-gray-700">
            Signed in as <span className="font-semibold">{profile.email || user.email}</span>
          </p>

          <form onSubmit={handleProfileSave} className="space-y-6 bg-white rounded-lg shadow-sm p-6">
            <div>
              <label className="block font-semibold mb-2">Username</label>
              <input
                type="text"
                value={username || profile.username || ""}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a unique username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used to identify your account. Keep it unique.
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-2">Display Name</label>
              <input
                type="text"
                value={displayName || profile.displayName || ""}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name we show in your orders"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber || profile.phoneNumber || ""}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254 7xx xxx xxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Location (City / Area)</label>
              <input
                type="text"
                value={location || profile.location || ""}
                onChange={(e) => setLocationField(e.target.value)}
                placeholder="e.g. Nairobi, Thika"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Address (Optional)</label>
              <input
                type="text"
                value={address || profile.address || ""}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, building, floor"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  signOut();
                  setLocation("/");
                }}
              >
                Sign Out
              </Button>
            </div>
          </form>

          <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-lg font-semibold text-red-600 mb-3">Delete Account</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete your Passmartshop account. Your past orders may still exist for
              record-keeping, but you won&apos;t be able to sign in again with this account.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Prefer to shop without an account?{" "}
              <Link href="/checkout">
                <a className="text-orange-600 hover:underline">Continue to checkout as guest</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Create an Account (Optional)</h1>
        <p className="text-gray-700 mb-6">
          You can create an account to save your details for faster checkout next time, or{" "}
          <Link href="/checkout">
            <a className="text-orange-600 hover:underline">continue to checkout as a guest</a>
          </Link>
          .
        </p>

        <div className="flex mb-6 border rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 text-center text-sm font-semibold ${
              mode === "register" ? "bg-orange-500 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setMode("register")}
          >
            Create Account
          </button>
          <button
            className={`flex-1 py-2 text-center text-sm font-semibold ${
              mode === "login" ? "bg-orange-500 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setMode("login")}
          >
            Log In
          </button>
        </div>

        {mode === "register" ? (
          <form onSubmit={handleRegister} className="space-y-4 bg-white rounded-lg shadow-sm p-6">
            <div>
              <label className="block font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Choose a unique username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2">Full Name (optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name we show in your orders"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Phone (optional)</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Location (optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocationField(e.target.value)}
                  placeholder="e.g. Nairobi, Thika"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2">Address (optional)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, building, floor"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg disabled:opacity-60"
            >
              {saving ? "Creating account..." : "Create Account"}
            </Button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Or continue with</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={saving}
              >
                Continue with Google
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 bg-white rounded-lg shadow-sm p-6">
            <div>
              <label className="block font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg disabled:opacity-60"
            >
              {saving ? "Signing in..." : "Log In"}
            </Button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Or continue with</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={saving}
              >
                Continue with Google
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

