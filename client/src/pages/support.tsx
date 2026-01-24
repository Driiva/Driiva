import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, HelpCircle } from "lucide-react";

export default function Support() {
  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat",
      color: "#10B981"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us at +44 20 7946 0958",
      action: "Call Now",
      color: "#3B82F6"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      action: "Send Email",
      color: "#F59E0B"
    }
  ];

  const faqItems = [
    {
      question: "How is my driving score calculated?",
      answer: "Your score is based on acceleration, braking, speed adherence, and night driving patterns."
    },
    {
      question: "When will I receive my refund?",
      answer: "Refunds are calculated annually and paid out at policy renewal."
    },
    {
      question: "Can I improve my driving score?",
      answer: "Yes! Focus on smooth acceleration, gentle braking, and adhering to speed limits."
    }
  ];

  return (
    <PageWrapper>
      <div className="pb-24 text-white">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Support</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
          <div className="space-y-4">
            {supportOptions.map((option, index) => (
              <Card key={index} className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${option.color}20` }}
                      >
                        <option.icon className="w-5 h-5" style={{ color: option.color }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{option.title}</h3>
                        <p className="text-sm text-gray-400">{option.description}</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-white/10 hover:bg-white/20 border-0 text-white" 
                      size="sm"
                    >
                      {option.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <Card key={index} className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-white mb-2">{item.question}</h3>
                      <p className="text-sm text-gray-400">{item.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </PageWrapper>
  );
}
