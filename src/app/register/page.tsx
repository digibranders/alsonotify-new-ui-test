"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button, Input, Checkbox, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useRegister } from "@/hooks/useAuth";
import Link from "next/link";
import BrandLogo from "@/assets/images/logo.png";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerMutation = useRegister();

  const inviteToken = searchParams.get("invite") ?? null;
  const inviteEmail = searchParams.get("email") ?? null;

  const [formData, setFormData] = useState({
    fullName: "",
    email: inviteEmail || "",
    password: "",
    confirmPassword: "",
    acceptTnC: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      message.error("Please fill in all fields");
      return;
    }

    if (formData.password.length < 10) {
      message.error("Password must be at least 10 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    if (!formData.acceptTnC) {
      message.error("Please accept the terms and conditions");
      return;
    }

    registerMutation.mutate(
      {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        token: inviteToken,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            if (inviteToken) {
              message.success("Registration successful!");
              router.push(`/company-details?t=${data.result.token}`);
            } else {
              message.success("Please check your email to verify your account");
              router.push("/register");
            }
          } else {
            message.error(data.message || "Registration failed");
          }
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Something went wrong. Please try again.";
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

      {/* Register Card Container */}
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
            Create an account
          </h1>

          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
            {/* Full Name */}
            <Input
              type="text"
              placeholder="Full Name*"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="h-10 rounded-full border border-white/60 bg-white/80 px-4 text-[15px] hover:bg-white focus:bg-white"
              required
            />

            {/* Email */}
            <Input
              type="email"
              placeholder="Email*"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!inviteEmail}
              className="h-10 rounded-full border border-white/60 bg-white/80 px-4 text-[15px] hover:bg-white focus:bg-white disabled:bg-white/40 disabled:text-black/75"
              required
            />

            {/* Password */}
            <Input.Password
              placeholder="Password*"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              prefix={<LockOutlined className="text-[#999999]" />}
              className="h-10 rounded-full border border-white/60 bg-white/80 px-4 text-[15px] hover:bg-white focus:bg-white"
              required
            />

            {/* Confirm Password */}
            <Input.Password
              placeholder="Confirm password*"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              prefix={<LockOutlined className="text-[#999999]" />}
              className="h-10 rounded-full border border-white/60 bg-white/80 px-4 text-[15px] hover:bg-white focus:bg-white"
              required
            />

            {/* Terms & Conditions */}
            <div className="flex justify-center items-center my-2">
              <Checkbox
                id="acceptTnC"
                checked={formData.acceptTnC}
                onChange={(e) =>
                  setFormData({ ...formData, acceptTnC: e.target.checked })
                }
                className="mr-2"
              />
              <label htmlFor="acceptTnC" className="text-[13px] text-neutral-700 cursor-pointer">
                I accept the{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-neutral-900">
                  terms & conditions
                </Link>
              </label>
            </div>

            {/* Create Account Button */}
            <Button
              htmlType="submit"
              loading={registerMutation.isPending}
              className="mx-auto block h-10 w-56 rounded-full border-0 text-[13px] font-semibold text-white transition-all duration-300 hover:opacity-90 active:scale-95 shadow-lg shadow-[#ff3b3b]/30"
              style={{
                background: "linear-gradient(180deg, #ff5a52 0%, #ff3b2f 100%)",
              }}
            >
              {registerMutation.isPending ? "Creating account..." : "CREATE AN ACCOUNT"}
            </Button>

            {/* Login Link */}
            <p className="text-center mt-5 text-[13px] text-neutral-700">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-2 hover:text-neutral-900">
                Log in
              </Link>
            </p>
            <p className="text-center mt-2 text-[12px] text-neutral-600">
              No credit card | Cancel Anytime
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

