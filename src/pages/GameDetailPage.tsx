import { useParams } from "react-router";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();

  return <h1>Game Detail {gameId}</h1>;
}
