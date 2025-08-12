import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LeaderboardMember {
  id: string;
  name: string;
  score: number;
  avatar_url?: string;
  rank: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-8 h-8 text-primary animate-glow-pulse" />;
    case 2:
      return <Trophy className="w-7 h-7 text-secondary" />;
    case 3:
      return <Medal className="w-6 h-6 text-bronze" />;
    default:
      return <Award className="w-5 h-5 text-muted-foreground" />;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-gold border-2 border-primary shadow-glow-gold animate-glow-pulse";
    case 2:
      return "bg-gradient-silver border-2 border-secondary shadow-glow-silver";
    case 3:
      return "bg-gradient-bronze border-2 border-bronze shadow-glow-bronze";
    default:
      return "bg-gradient-card border border-border shadow-card hover:bg-accent/20";
  }
};

const PodiumCard = ({ member, position }: { member: LeaderboardMember; position: 1 | 2 | 3 }) => {
  const heights = {
    1: "h-48",
    2: "h-40", 
    3: "h-36"
  };

  return (
    <div className={`${heights[position]} flex flex-col justify-end animate-float`}>
      <Card className={`${getRankStyle(position)} relative overflow-hidden transition-all duration-300 hover:scale-105`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-rank-shine" />
        <CardContent className="p-6 text-center">
          <div className="relative mb-4">
            <Avatar className="w-20 h-20 mx-auto border-2 border-white/20">
              <AvatarImage src={member.avatar_url} alt={member.name} />
              <AvatarFallback className="text-lg font-bold bg-muted">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2">
              {getRankIcon(position)}
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2">{member.name}</h3>
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-2xl font-bold">{member.score.toLocaleString()}</span>
          </div>
          <Badge variant="secondary" className="mt-2">
            #{position}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

const LeaderboardRow = ({ member, index }: { member: LeaderboardMember; index: number }) => {
  return (
    <Card className={`${getRankStyle(member.rank)} transition-all duration-300 hover:scale-[1.02] group`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-center w-8 h-8">
              {getRankIcon(member.rank)}
            </div>
            <Avatar className="w-12 h-12 border border-white/20">
              <AvatarImage src={member.avatar_url} alt={member.name} />
              <AvatarFallback className="bg-muted font-semibold">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-lg truncate">{member.name}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Rank #{member.rank}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xl font-bold text-success">
                {member.score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Leaderboard() {
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
    checkAdminStatus();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_members')
        .select('*')
        .order('score', { ascending: false });

      if (error) throw error;

      // Assign ranks based on sorted order
      const rankedMembers = (data || []).map((member: any, idx: number) => ({
        ...member,
        rank: idx + 1,
      }));

      setMembers(rankedMembers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (data) setIsAdmin(true);
    } catch (error) {
      // User is not admin or not logged in
    }
  };

  const topThree = members.slice(0, 3);
  const remaining = members.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-primary mx-auto mb-4 animate-glow-pulse" />
          <p className="text-xl text-muted-foreground">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-12 h-12 text-primary animate-glow-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <Crown className="w-12 h-12 text-primary animate-glow-pulse" />
          </div>
          <p className="text-xl text-muted-foreground">
            Compete for glory and climb to the top!
          </p>
          
          {isAdmin && (
            <div className="mt-6">
              <Button 
                onClick={() => navigate('/admin')} 
                variant="default"
                className="bg-gradient-gold text-primary-foreground hover:scale-105 transition-transform"
              >
                Admin Panel
              </Button>
            </div>
          )}
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-primary">Champions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Silver - 2nd place */}
              {topThree[1] && (
                <div className="md:order-1">
                  <PodiumCard member={topThree[1]} position={2} />
                </div>
              )}
              
              {/* Gold - 1st place */}
              {topThree[0] && (
                <div className="md:order-2">
                  <PodiumCard member={topThree[0]} position={1} />
                </div>
              )}
              
              {/* Bronze - 3rd place */}
              {topThree[2] && (
                <div className="md:order-3">
                  <PodiumCard member={topThree[2]} position={3} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remaining Rankings */}
        {remaining.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-primary">Rankings</h2>
            <div className="space-y-4">
              {remaining.map((member, index) => (
                <LeaderboardRow 
                  key={member.id} 
                  member={member} 
                  index={index + 3} 
                />
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Rankings Yet</h3>
            <p className="text-muted-foreground">Be the first to join the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
}