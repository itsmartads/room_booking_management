export default interface Booking {
	room: string;
	timeFrom: string;
	timeTo: string;
	bookedBy: string;
	purpose: string;
}

export interface BookingForm {
	selectedRoom: string;
	selectedDate: string;
	timeFrom: string;
	timeTo: string;
	bookedBy: string;
	purpose: string;
}
