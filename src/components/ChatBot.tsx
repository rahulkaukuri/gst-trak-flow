import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const KB: Record<string, string> = {
  'itc at risk': 'Your ITC may be at risk if the seller has not filed GSTR-1, GSTR-3B, or has not paid the tax. The system checks all three conditions and assigns a risk score accordingly.',
  'supplier flagged': 'A supplier is flagged when more than 50% of their invoices are classified as high-risk. This could be due to non-filing of returns, unpaid taxes, or missing invoice reflections in GSTR-2B.',
  'gstr-3b': 'GSTR-3B is a monthly self-declaration return filed by every registered taxpayer. It contains summary of outward supplies, ITC claimed, and tax liability. Non-filing of GSTR-3B by the supplier puts buyer ITC at risk.',
  'gstr-1': 'GSTR-1 is a monthly/quarterly return for outward supplies. Sellers must declare all B2B invoices here. If not filed, the invoice won\'t appear in buyer\'s GSTR-2B.',
  'gstr-2b': 'GSTR-2B is an auto-generated ITC statement for buyers. It pulls data from seller\'s GSTR-1. If an invoice is missing here, ITC cannot be claimed safely.',
  'graph detection': 'Our knowledge graph maps all GST transactions as nodes (buyers, sellers, invoices, returns) and edges (relationships). GraphSAGE performs node classification to detect fraud patterns, while GAT assigns attention weights to edges to identify suspicious transaction chains.',
  'graphsage': 'GraphSAGE (Graph Sample and Aggregate) is a graph neural network that classifies nodes by aggregating features from neighboring nodes. In our system, it analyzes a seller\'s transaction neighborhood to predict fraud probability.',
  'gat': 'GAT (Graph Attention Network) uses attention mechanisms to weigh the importance of different edges. It identifies suspicious invoice chains by focusing on incomplete or anomalous transaction paths.',
  'risk score': 'Risk scores range from 0-100. 0-30 is Low Risk (green), 31-60 is Medium Risk (amber), 61-100 is High Risk (red). Scores are calculated based on GSTR filing status, tax payment, and GSTR-2B reflection.',
  'itc': 'Input Tax Credit (ITC) allows buyers to claim credit for GST paid on purchases. Valid ITC requires: seller filed GSTR-1, invoice in buyer GSTR-2B, seller filed GSTR-3B, and seller paid tax.',
  'fraud': 'Fraud detection uses a combination of rule-based checks and simulated Graph ML models. Entities with >50% high-risk invoices are flagged as Fraud Suspects with confidence scores.',
  'reconciliation': 'Reconciliation automatically cross-references seller invoices with buyer ITC claims. It checks GSTR-1 filing, GSTR-2B reflection, GSTR-3B filing, and tax payment status to determine ITC validity.',
};

const SUGGESTIONS = [
  'Why is my ITC at risk?',
  'How does graph detection work?',
  'What is GSTR-3B?',
  'How is risk score calculated?',
];

function findAnswer(query: string): string {
  const lower = query.toLowerCase();
  for (const [key, value] of Object.entries(KB)) {
    if (lower.includes(key)) return value;
  }
  if (lower.includes('hello') || lower.includes('hi')) return 'Hello! I\'m the GST AI Robo Assistant. Ask me about ITC rules, risk scores, GSTR filings, or how our graph-based fraud detection works.';
  if (lower.includes('help')) return 'I can help with: ITC eligibility rules, risk score explanation, GSTR filing requirements, fraud detection methodology, and GraphSAGE/GAT model explanations. Just ask!';
  return 'I understand GST-related queries. Try asking about ITC rules, risk scores, GSTR filings, supplier flagging, or graph-based fraud detection. Type "help" for options.';
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: 'Hello! I\'m the GST AI Robo Assistant. Ask me about ITC, risk scores, fraud detection, or GST compliance.', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, text, sender: 'user' };
    const botMsg: Message = { id: `b-${Date.now()}`, text: findAnswer(text), sender: 'bot' };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 w-[380px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/50">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">GST AI Robo Assistant</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary/20 text-foreground'
                      : 'bg-secondary text-foreground'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="px-3 py-2 border-t border-border">
              <div className="flex flex-wrap gap-1 mb-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send(input)}
                  placeholder="Ask about GST…"
                  className="text-xs h-8"
                />
                <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => send(input)}>
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
        style={{ boxShadow: '0 0 20px hsl(160 84% 39% / 0.4)' }}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </motion.button>
    </>
  );
}
