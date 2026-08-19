"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, LogOut, Cloud, CloudOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { syncOnLoad, resetSyncMarker } from "@/lib/sync";
import type { MiraLocalData } from "@/lib/types";

type Props = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
};

type Mode = "signin" | "signup";

export function SyncSettings({ data, persist }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Следим за состоянием входа.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: u }) => setUserEmail(u.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const runSync = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const merged = await syncOnLoad();
      persist(merged);
      setLastSyncedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      setMessage("Синхронизировано ✓");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка синхронизации");
    } finally {
      setBusy(false);
    }
  }, [persist]);

  async function handleAuth() {
    if (!supabase || !email || password.length < 6) return;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data: res, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!res.session) {
          setMessage("Проверь почту и подтверди адрес, потом войди.");
          setBusy(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setPassword("");
      await runSync(); // сразу подтянуть/залить данные после входа
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка входа");
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    resetSyncMarker();
    setUserEmail(null);
    setMessage(null);
  }

  if (!supabase) {
    return (
      <Card className="max-w-lg p-6">
        <div className="flex items-center gap-2 text-mira-muted">
          <CloudOff className="h-5 w-5" />
          <p className="text-sm">Синхронизация не настроена (нет ключей Supabase).</p>
        </div>
      </Card>
    );
  }

  // ── Вошёл ──
  if (userEmail) {
    return (
      <Card className="max-w-lg p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mira-lavender-light">
            <Cloud className="h-6 w-6 text-mira-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-mira-text">Синхронизация включена</p>
            <p className="text-xs text-mira-muted">{userEmail}</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-mira-muted">
          Данные хранятся на этом устройстве и копируются в твоё облако. Войди с тем же
          адресом на другом устройстве, чтобы увидеть их там.
        </p>

        <Button className="mb-2 w-full" onClick={runSync} disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Синхронизировать сейчас
        </Button>
        <Button variant="ghost" className="w-full" onClick={handleSignOut} disabled={busy}>
          <LogOut className="h-4 w-4" /> Выйти
        </Button>

        {lastSyncedAt && <p className="mt-3 text-center text-xs text-mira-muted">Последний синк: {lastSyncedAt}</p>}
        {message && <p className="mt-2 text-center text-xs text-mira-success">{message}</p>}

        <div className="mt-4 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-3">
          <p className="text-xs text-mira-success">
            Доступ к данным только у тебя (Row Level Security). Без входа приложение
            работает полностью локально.
          </p>
        </div>
      </Card>
    );
  }

  // ── Не вошёл ──
  return (
    <Card className="max-w-lg p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mira-lavender-light">
          <Cloud className="h-6 w-6 text-mira-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-mira-text">Синхронизация между устройствами</p>
          <p className="text-xs text-mira-muted">Необязательно — резервная копия и доступ с других устройств</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 rounded-2xl border-2 border-mira-lavender/30 px-3 py-2.5 focus-within:border-mira-primary transition">
          <Mail className="h-4 w-4 text-mira-muted" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full bg-transparent text-sm text-mira-text outline-none placeholder:text-mira-muted"
          />
        </label>
        <label className="flex items-center gap-2 rounded-2xl border-2 border-mira-lavender/30 px-3 py-2.5 focus-within:border-mira-primary transition">
          <Lock className="h-4 w-4 text-mira-muted" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (от 6 символов)"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full bg-transparent text-sm text-mira-text outline-none placeholder:text-mira-muted"
          />
        </label>
      </div>

      <Button className="mt-4 w-full" onClick={handleAuth} disabled={busy || !email || password.length < 6}>
        {busy ? "..." : mode === "signup" ? "Зарегистрироваться" : "Войти"}
      </Button>

      <button
        onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(null); }}
        className="mt-3 w-full text-center text-xs text-mira-muted hover:text-mira-primary transition"
      >
        {mode === "signup" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
      </button>

      {message && <p className="mt-3 text-center text-xs text-mira-primary">{message}</p>}

      <div className="mt-4 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-3">
        <p className="text-xs text-mira-success">
          Без входа всё работает локально на устройстве. Вход нужен только для копии в
          облаке и синхронизации.
        </p>
      </div>
    </Card>
  );
}
