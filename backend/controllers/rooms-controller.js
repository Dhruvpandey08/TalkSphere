const RoomDto = require('../dtos/room.dto');
const roomService = require('../services/room-service');

class RoomsController {
    async create(req, res) {
        const { topic, roomType, ownerId } = req.body; // Pass ownerId in request body
    
        if (!topic || !roomType || !ownerId) {
            return res.status(400).json({ message: 'All fields are required!' });
        }
    
        const room = await roomService.create({
            topic,
            roomType,
            ownerId: ownerId, // Use ownerId from the request body
        });
    
        return res.json(new RoomDto(room));
    }
    

    async index(req, res) {
        const rooms = await roomService.getAllRooms(['open']);
        const allRooms = rooms.map((room) => new RoomDto(room));
        return res.json(allRooms);
    }

    async show(req, res) {
        const room = await roomService.getRoom(req.params.roomId);

        return res.json(room);
    }
}

module.exports = new RoomsController();
