import { useAuth } from "@workos-inc/authkit-react";
import { ArrowRight, LockKeyhole, Route, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInScreen() {
  const { signIn, signUp } = useAuth();

  return (
    <main className="signin-page">
      <section className="signin-story">
        <div className="signin-brand"><span><Route size={16} /></span> Waypoint</div>
        <div className="signin-story-copy">
          <p>Careers, with direction.</p>
          <h1>Turn a crowded search into a clear shortlist.</h1>
          <div className="signin-principles">
            <span><TableProperties size={15} /> Every company in one calm workspace</span>
            <span><LockKeyhole size={15} /> Private by default</span>
          </div>
        </div>
        <p className="signin-footnote">A personal opportunity database built for momentum.</p>
      </section>
      <section className="signin-action">
        <div className="signin-panel">
          <div className="signin-mobile-brand"><span><Route size={15} /></span> Waypoint</div>
          <p className="signin-kicker">Welcome back</p>
          <h2>Your next move starts here.</h2>
          <p className="signin-description">Sign in to open your private careers workspace.</p>
          <div className="signin-buttons">
            <Button className="w-full" size="lg" onClick={() => void signIn()}>
              Continue to Waypoint <ArrowRight size={15} />
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => void signUp()}
            >
              Create account
            </Button>
          </div>
          <p className="signin-privacy">
            <LockKeyhole size={12} /> Your tracker is visible only to you.
          </p>
        </div>
      </section>
    </main>
  );
}
