import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShoppingBag, Gem, Palette, User, Crown, Circle, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Shop() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('gems');
  const [inventory, setInventory] = useState([]);
  const [purchaseDialog, setPurchaseDialog] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        loadInventory(currentUser.id);
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const loadInventory = async (userId) => {
    try {
      const items = await base44.entities.UserInventory.filter({ user_id: userId });
      setInventory(items || []);
    } catch (error) {
      console.log('Erreur chargement inventaire:', error);
    }
  };

  const { data: shopItems = [] } = useQuery({
    queryKey: ['shopItems'],
    queryFn: () => base44.entities.ShopItem.list()
  });

  // Mock shop items
  const mockItems = {
    gems: [
      { id: '9', name: '50 Gemmes', description: 'Pack starter', price_gems: 0, real_price: '0.49€', category: 'gems', image_url: '💎' },
      { id: '10', name: '100 Gemmes', description: 'Pack petit', price_gems: 0, real_price: '0.99€', category: 'gems', image_url: '💎' },
      { id: '11', name: '500 Gemmes', description: 'Pack moyen', price_gems: 0, real_price: '2.99€', category: 'gems', image_url: '💎💎' },
      { id: '12', name: '1500 Gemmes (+300 BONUS)', description: 'Pack grand', price_gems: 0, real_price: '6.99€', category: 'gems', image_url: '💎💎💎' }
    ],
    themes: [
      { id: '1', name: 'Thème Royal', description: 'Un thème doré élégant', price_gems: 100, category: 'theme', image_url: '🏰' },
      { id: '2', name: 'Thème Néon', description: 'Couleurs vives et modernes', price_gems: 150, category: 'theme', image_url: '🌈' },
      { id: '3', name: 'Thème Classique', description: 'Style bois traditionnel', price_gems: 80, category: 'theme', image_url: '🪵' },
      { id: '13', name: 'Thème Espace', description: 'Galaxie étoilée', price_gems: 120, category: 'theme', image_url: '🌌' },
      { id: '14', name: 'Thème Océan', description: 'Bleu aquatique', price_gems: 100, category: 'theme', image_url: '🌊' },
      { id: '15', name: 'Thème Feu', description: 'Rouge flammes', price_gems: 130, category: 'theme', image_url: '🔥' },
      { id: '16', name: 'Thème Or', description: 'Doré luxueux', price_gems: 200, category: 'theme', image_url: '✨' },
      { id: '17', name: 'Thème Rétro', description: 'Style vintage', price_gems: 90, category: 'theme', image_url: '📼' }
    ],
    avatars: [
      { id: '4', name: 'Roi Légendaire', description: 'Avatar exclusif', price_gems: 200, category: 'avatar', image_url: '👑' },
      { id: '5', name: 'Chevalier', description: 'Noble guerrier', price_gems: 120, category: 'avatar', image_url: '⚔️' },
      { id: '6', name: 'Magicien', description: 'Maître des stratégies', price_gems: 150, category: 'avatar', image_url: '🧙' },
      { id: '18', name: 'Dragon Légendaire', description: 'Créature mythique puissante', price_gems: 250, category: 'avatar', image_url: '🐉' },
      { id: '19', name: 'Ninja Furtif', description: 'Maître de l\'ombre', price_gems: 180, category: 'avatar', image_url: '🥷' },
      { id: '20', name: 'Princesse Royale', description: 'Grâce et élégance', price_gems: 150, category: 'avatar', image_url: '👸' },
      { id: '21', name: 'Pirate Aventurier', description: 'Navigateur des mers', price_gems: 140, category: 'avatar', image_url: '🏴‍☠️' },
      { id: '22', name: 'Robot Futuriste', description: 'Intelligence artificielle', price_gems: 160, category: 'avatar', image_url: '🤖' },
      { id: '23', name: 'Sorcier Mystique', description: 'Maître de la magie', price_gems: 170, category: 'avatar', image_url: '🧝' },
      { id: '24', name: 'Champion Sportif', description: 'Athlète d\'élite', price_gems: 130, category: 'avatar', image_url: '⚽' }
    ],
    boards: [
      { id: '7', name: 'Plateau Marbre', description: 'Élégance intemporelle', price_gems: 180, category: 'board', image_url: '🪨' },
      { id: '8', name: 'Plateau Jade', description: 'Pierre précieuse', price_gems: 250, category: 'board', image_url: '💎' },
      { id: '25', name: 'Plateau Cristal', description: 'Transparent brillant', price_gems: 220, category: 'board', image_url: '🔮' },
      { id: '26', name: 'Plateau Obsidienne', description: 'Noir profond', price_gems: 200, category: 'board', image_url: '⚫' },
      { id: '27', name: 'Plateau Arc-en-ciel', description: 'Multicolore', price_gems: 280, category: 'board', image_url: '🌈' },
      { id: '28', name: 'Plateau Bois Précieux', description: 'Acajou sculpté', price_gems: 190, category: 'board', image_url: '🪵' }
    ],
    bundles: [
      { id: '29', name: 'Pack Débutant', description: '1 thème + 1 avatar + 1 plateau', price_gems: 350, real_value: 450, category: 'bundle', image_url: '🎁', discount: '-22%' },
      { id: '30', name: 'Pack VIP', description: 'Tous les thèmes actuels', price_gems: 600, real_value: 820, category: 'bundle', image_url: '👑', discount: '-27%' },
      { id: '31', name: 'Pack Complet', description: 'Tout débloquer', price_gems: 1500, real_value: 3000, category: 'bundle', image_url: '🌟', discount: '-50%' }
    ]
  };

  const displayItems = shopItems.length > 0 ? shopItems : mockItems;

  const handlePurchase = async (item) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    if (item.category === 'gems') {
      alert('Redirection vers le paiement...');
      return;
    }

    if ((user.gems || 0) < item.price_gems) {
      alert('Vous n\'avez pas assez de gemmes !');
      return;
    }

    try {
      await base44.auth.updateMe({
        gems: (user.gems || 100) - item.price_gems,
        purchased_items: [...(user.purchased_items || []), item.id]
      });
      setUser(prev => ({
        ...prev,
        gems: (prev.gems || 100) - item.price_gems,
        purchased_items: [...(prev.purchased_items || []), item.id]
      }));
      alert('Achat réussi !');
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  const isOwned = (itemId) => user?.purchased_items?.includes(itemId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Boutique</h1>
            <p className="text-sm text-gray-400">Personnalisez votre expérience</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Gem className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-amber-200">{user?.gems || 100}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 bg-white/5 border border-white/10">
          <TabsTrigger value="gems" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Gem className="w-4 h-4 mr-1" />
            Gemmes
          </TabsTrigger>
          <TabsTrigger value="themes" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Palette className="w-4 h-4 mr-1" />
            Thèmes
          </TabsTrigger>
          <TabsTrigger value="avatars" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <User className="w-4 h-4 mr-1" />
            Avatars
          </TabsTrigger>
          <TabsTrigger value="boards" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Crown className="w-4 h-4 mr-1" />
            Plateaux
          </TabsTrigger>
          <TabsTrigger value="bundles" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Sparkles className="w-4 h-4 mr-1" />
            Packs
          </TabsTrigger>
        </TabsList>

        {Object.entries(mockItems).map(([category, items]) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all relative"
                >
                  {item.discount && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500/90 text-white border-red-400">
                      {item.discount}
                    </Badge>
                  )}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center text-2xl">
                      {item.image_url}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      <p className="text-sm text-gray-400">{item.description}</p>
                      {item.real_value && (
                        <p className="text-xs text-gray-500 line-through">Valeur: {item.real_value} gemmes</p>
                      )}
                    </div>
                  </div>

                  {isOwned(item.id) ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" />
                      Possédé
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(item)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 whitespace-nowrap"
                    >
                      {item.real_price ? (
                        <span>{item.real_price}</span>
                      ) : (
                        <>
                          <Gem className="w-4 h-4 mr-1" />
                          {item.price_gems}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}