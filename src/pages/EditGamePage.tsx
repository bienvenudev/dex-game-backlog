import { useParams } from "react-router";

export default function EditGamePage() {
  const { gameId } = useParams<{ gameId: string }>();

  return <h1>Edit Game: {gameId}</h1>;
}
