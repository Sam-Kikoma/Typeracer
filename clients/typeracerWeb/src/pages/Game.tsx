import { useEffect, useState } from "react";
import { Table } from "../components/retroui/Table";
import axios from "axios";

const Game = () => {
	const API_URL = "http://localhost:3002/api/rooms";
	const [rooms, setRooms] = useState([]);

	const getRooms = async () => {
		try {
			const response = await axios.get(`${API_URL}`);
			setRooms(response.data.rooms);
		} catch (error) {
			console.error("Error fetching rooms:", error);
		}
	};

	useEffect(() => {
		getRooms();
	}, []);

	return (
		<div className="flex">
			<div>
				<Table>
					<Table.Header>
						<Table.Row>
							<Table.Head>Room ID</Table.Head>
							<Table.Head>Room Status</Table.Head>
							<Table.Head>Join</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{rooms.map((room) => (
							<Table.Row key={room.id}>
								<Table.Cell>{room.code}</Table.Cell>
								<Table.Cell>{room.status}</Table.Cell>
								<Table.Cell>
									<button>Join</button>
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</Table>
			</div>
		</div>
	);
};

export default Game;
