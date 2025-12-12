"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Input, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useLogin } from "@/hooks/useAuth";
import Link from "next/link";
import BrandLogo from "@/assets/images/logo.png";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      message.error("Please fill in all fields");
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          message.success("Login successful!");
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Invalid credentials or server error.";
          message.error(errorMessage);
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative px-4 py-14"
      style={{
        background: "linear-gradient(68deg, #f5f5f7 0%, #eaeaea 100.59%)"
      }}
    >
      {/* Top-left brand */}
      <div className="absolute left-4 top-4 sm:left-7 sm:top-7">
        <Link href="/">
          <Image
            src={BrandLogo}
            alt="Alsonotify"
            width={120}
            height={29}
            className="h-7 sm:h-8 w-auto object-contain select-none"
            draggable={false}
            priority
          />
        </Link>
      </div>

      {/* Login Card Container */}
      <div
        className="w-full max-w-[700px] rounded-3xl px-4 sm:px-6"
        style={{
          background: "linear-gradient(100deg, rgba(255, 255, 255, 0.9) 0%, rgba(156, 163, 175, 0.5) 100%)"
        }}
      >
        <div className="px-6 sm:px-10 py-10">
          <h1
            className="text-center font-semibold mb-8 leading-10"
            style={{ color: "#ff3b30", fontSize: "2rem" }}
          >
            Welcome Back
          </h1>

          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
            {/* Email */}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<UserOutlined className="text-[#999999]" />}
              className="h-10 rounded-full border border-white/60 bg-white/80 px-4 text-[15px] hover:bg-white focus:bg-white"
              required
            />

            {/* Password */}
            <Input.Password
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={<LockOutlined className="text-[#999999]" />}
              className="h-10 rounded-full border border-white/60 bg-white/80 px-4 text-[15px] hover:bg-white focus:bg-white"
              iconRender={(visible) => (visible ? <></> : <></>)} // Hide default eye if needed, or keep it. Input.Password has eye by default.
              required
            />

            {/* Footer links */}
            <div className="mb-2 mt-1 flex w-full items-center justify-between text-[13px] text-neutral-600">
              <Link
                href="/forgot-password"
                className="cursor-pointer hover:text-neutral-900 underline-offset-2 hover:underline"
              >
                Forgot Password?
              </Link>
              <Link
                href="/register"
                className="cursor-pointer hover:text-neutral-900 underline-offset-2 hover:underline"
              >
                Create Account
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              htmlType="submit"
              loading={loginMutation.isPending}
              className="mx-auto block h-10 w-full rounded-full border-0 text-[13px] font-semibold text-white transition-all duration-300 hover:opacity-90 active:scale-95 shadow-lg shadow-[#ff3b3b]/30"
              style={{
                background: "linear-gradient(180deg, #ff5a52 0%, #ff3b2f 100%)",
              }}
            >
              {loginMutation.isPending ? "Signing in..." : "SIGN IN"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

