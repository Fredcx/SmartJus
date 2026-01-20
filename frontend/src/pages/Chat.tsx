import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";

const Chat = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10 space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Hammer className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Em Construção</h1>
          <p className="text-muted-foreground">
            O Agente Jurídico IA está sendo desenvolvido para oferecer a melhor experiência. Em breve disponível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;