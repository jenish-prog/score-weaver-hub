import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  UserPlus, 
  Trophy,
  Settings,
  Users,
  TrendingUp,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardMember {
  id: string;
  name: string;
  score: number;
  avatar_url?: string;
  rank: number;
}

interface EditingMember {
  id: string;
  name: string;
  score: number;
  avatar_url: string;
}

export default function AdminPanel() {
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    score: "",
    avatar_url: ""
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_members')
        .select('*')
        .order('score', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leaderboard members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRanks = async () => {
    try {
      // Sort members by score and update ranks
      const sortedMembers = [...members].sort((a, b) => b.score - a.score);
      
      for (let i = 0; i < sortedMembers.length; i++) {
        const { error } = await supabase
          .from('leaderboard_members')
          .update({ rank: i + 1 })
          .eq('id', sortedMembers[i].id);
        
        if (error) throw error;
      }
      
      await fetchMembers();
    } catch (error) {
      console.error('Error updating ranks:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      const score = parseInt(newMember.score);
      if (isNaN(score)) {
        toast({
          title: "Invalid Score",
          description: "Please enter a valid number for the score",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('leaderboard_members')
        .insert([{
          name: newMember.name,
          score: score,
          avatar_url: newMember.avatar_url || null,
          rank: members.length + 1 // Temporary rank, will be updated
        }]);

      if (error) throw error;

      await updateRanks();
      setNewMember({ name: "", score: "", avatar_url: "" });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Member added successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive"
      });
    }
  };

  const handleEditMember = async (member: LeaderboardMember) => {
    setEditingMember({
      id: member.id,
      name: member.name,
      score: member.score,
      avatar_url: member.avatar_url || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    try {
      const { error } = await supabase
        .from('leaderboard_members')
        .update({
          name: editingMember.name,
          score: editingMember.score,
          avatar_url: editingMember.avatar_url || null
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      await updateRanks();
      setEditingMember(null);
      
      toast({
        title: "Success",
        description: "Member updated successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leaderboard_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await updateRanks();
      
      toast({
        title: "Success",
        description: "Member deleted successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive"
      });
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-gradient-gold text-primary-foreground">🥇 Champion</Badge>;
      case 2:
        return <Badge className="bg-gradient-silver text-secondary-foreground">🥈 Runner-up</Badge>;
      case 3:
        return <Badge className="bg-gradient-bronze text-bronze-foreground">🥉 Third Place</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-xl text-muted-foreground">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Settings className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage leaderboard members and scores</p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-primary-foreground hover:scale-105 transition-transform">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add New Member
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Enter member name"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="score">Score</Label>
                  <Input
                    id="score"
                    type="number"
                    value={newMember.score}
                    onChange={(e) => setNewMember({ ...newMember, score: e.target.value })}
                    placeholder="Enter score"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar">Avatar URL (Optional)</Label>
                  <Input
                    id="avatar"
                    value={newMember.avatar_url}
                    onChange={(e) => setNewMember({ ...newMember, avatar_url: e.target.value })}
                    placeholder="Enter avatar URL"
                    className="bg-input border-border"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleAddMember}
                    className="flex-1 bg-gradient-gold text-primary-foreground"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-border"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="w-12 h-12 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-12 h-12 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Highest Score</p>
                  <p className="text-3xl font-bold">
                    {members.length > 0 ? members[0]?.score?.toLocaleString() : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Crown className="w-12 h-12 text-primary animate-glow-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Leader</p>
                  <p className="text-xl font-bold truncate">
                    {members.length > 0 ? members[0]?.name : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Leaderboard Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Rank</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="border-border">
                      <TableCell>
                        {getRankBadge(member.rank)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={member.avatar_url} alt={member.name} />
                            <AvatarFallback className="bg-muted">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {editingMember?.id === member.id ? (
                            <Input
                              value={editingMember.name}
                              onChange={(e) => setEditingMember({
                                ...editingMember,
                                name: e.target.value
                              })}
                              className="w-40 bg-input border-border"
                            />
                          ) : (
                            <span className="font-medium">{member.name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingMember?.id === member.id ? (
                          <Input
                            type="number"
                            value={editingMember.score}
                            onChange={(e) => setEditingMember({
                              ...editingMember,
                              score: parseInt(e.target.value) || 0
                            })}
                            className="w-24 bg-input border-border"
                          />
                        ) : (
                          <span className="font-bold text-success">
                            {member.score.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingMember?.id === member.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="bg-success text-success-foreground"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMember(null)}
                                className="border-border"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMember(member)}
                                className="border-border hover:bg-accent"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {members.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground">Add your first leaderboard member to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}