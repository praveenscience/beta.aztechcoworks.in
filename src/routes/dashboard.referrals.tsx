import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, whatsappLink, inr } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Copy, Gift, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const referrals = useStore(useShallow((s) => s.referrals.filter((r) => r.referrerUserId === me?.id)));
  if (!me) return null;
  const rewarded = referrals.filter((r) => r.status === "rewarded");
  const totalRewards = rewarded.reduce((s, r) => s + r.rewardAmount, 0);

  const copy = () => {
    navigator.clipboard.writeText(me.referralCode);
    toast.success("Referral code copied!");
  };

  return (
    <>
      <PageHeader title="Referrals" description="Earn ₹2,500 in credit for every friend who joins." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Your referral code</CardTitle>
            <CardDescription>Share this with founders, freelancers, and teams in Coimbatore.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-6">
              <Gift className="h-8 w-8 text-accent" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Code</div>
                <div className="font-mono text-2xl font-bold">{me.referralCode}</div>
              </div>
              <Button variant="outline" onClick={copy}><Copy className="mr-1.5 h-4 w-4" />Copy</Button>
              <Button asChild>
                <a href={whatsappLink(`Hey! Try Aztech Co-Works in Coimbatore. Use my code ${me.referralCode} when you sign up.`)} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4" /> Share
                </a>
              </Button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <Stat label="Referred" value={String(referrals.length)} />
              <Stat label="Converted" value={String(referrals.filter((r) => r.status !== "pending").length)} />
              <Stat label="Rewards" value={inr(totalRewards)} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Step n={1} t="Share your code" d="Send your unique code to anyone looking for workspace." />
            <Step n={2} t="They sign up" d="They get 1 free day pass + 10% off month 1." />
            <Step n={3} t="You earn" d="₹2,500 credit added to your account on their first invoice." />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function Step({ n, t, d }: { n: number; t: string; d: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-bold">{n}</div>
      <div><div className="font-semibold">{t}</div><div className="text-muted-foreground">{d}</div></div>
    </div>
  );
}
