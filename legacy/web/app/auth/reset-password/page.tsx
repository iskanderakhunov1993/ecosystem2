"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("form");
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const canSubmit = password.length >= 8 && password === confirm;

  const handleSubmit = async () => {
    if (!supabase || !canSubmit) return;
    setStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-mira-text">
        <Card className="max-w-md p-7 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-mira-success">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-[-0.05em]">Пароль обновлён</h1>
          <p className="mt-3 text-sm leading-6 text-mira-muted">
            Новый пароль сохранён. Теперь можно вернуться в приложение.
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={() => window.location.href = "/"}>
            Открыть Mira
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-mira-text">
      <Card className="max-w-md p-7">
        <a href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-mira-primary">
          <ArrowLeft className="h-4 w-4" /> Назад
        </a>
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-mira-primary text-white">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-black tracking-[-0.05em]">Новый пароль</h1>
        <p className="mt-3 text-sm leading-6 text-mira-muted">
          Введи новый пароль. Минимум 8 символов.
        </p>
        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-mira-muted">Новый пароль</span>
            <input
              className="h-14 w-full rounded-2xl border border-[#E8E4DE] bg-[#F3EFEA] px-4 text-mira-text outline-none transition focus:border-mira-primary"
              type="password"
              minLength={8}
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-mira-muted">Повторите пароль</span>
            <input
              className="h-14 w-full rounded-2xl border border-[#E8E4DE] bg-[#F3EFEA] px-4 text-mira-text outline-none transition focus:border-mira-primary"
              type="password"
              minLength={8}
              placeholder="Ещё раз"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
        </div>
        {password && confirm && password !== confirm && (
          <p className="mt-3 text-sm text-mira-cycle">Пароли не совпадают</p>
        )}
        {status === "error" && (
          <p className="mt-3 text-sm text-mira-cycle">{errorMessage || "Не удалось обновить пароль. Попробуй запросить ссылку заново."}</p>
        )}
        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={!canSubmit || status === "loading"}
          onClick={handleSubmit}
        >
          {status === "loading" ? "Сохраняем..." : "Сохранить пароль"}
        </Button>
      </Card>
    </main>
  );
}
