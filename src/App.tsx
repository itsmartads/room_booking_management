import { useState, useEffect, useCallback } from "react";
import {
	Calendar,
	Clock,
	User,
	FileText,
	CheckCircle,
	XCircle,
	Loader,
} from "lucide-react";
import { getTodayDate, timeToMinutes } from "./utils";
import type Booking from "./types/booking";
import type { BookingForm } from "./types/booking";

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL;

const rooms = [
	"Phòng Tin cậy (G)",
	"Phòng Sáng tạo (Pantry - Trong)",
	"Phòng Sáng tạo (Pantry - Ngoài)",
	"Phòng Trệt nhỏ (G)",
];

export default function App() {
	const [data, setData] = useState<BookingForm>({
		selectedRoom: "",
		selectedDate: getTodayDate(),
		timeFrom: "09:00",
		timeTo: "10:00",
		bookedBy: "",
		purpose: "",
	});

	const [bookings, setBookings] = useState<Booking[]>([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState({ type: "", text: "" });

	// Lấy danh sách booking từ Google Sheets
	const fetchBookings = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`${WEBAPP_URL}?action=getBookings&room=${encodeURIComponent(
					data.selectedRoom
				)}&date=${data.selectedDate}`
			);
			const responseData = await response.json();

			if (responseData.success) {
				setBookings(responseData.bookings || []);
			} else {
				setMessage({
					type: "error",
					text: responseData.message || "Không thể tải dữ liệu",
				});
			}
		} catch (error: any) {
			setMessage({ type: "error", text: "Lỗi kết nối: " + error.message });
		} finally {
			setLoading(false);
		}
	}, [data.selectedRoom, data.selectedDate]);

	// Load bookings khi chọn phòng hoặc ngày
	useEffect(() => {
		if (data.selectedRoom && data.selectedDate) {
			fetchBookings();
		}
	}, [data.selectedRoom, data.selectedDate, fetchBookings]);

	// Kiểm tra xem khung giờ có bị trùng không
	function isTimeSlotAvailable(from: string, to: string) {
		const newFrom = timeToMinutes(from);
		const newTo = timeToMinutes(to);

		for (const booking of bookings) {
			const bookedFrom = timeToMinutes(booking.timeFrom);
			const bookedTo = timeToMinutes(booking.timeTo);

			// Kiểm tra trùng lặp
			if (newFrom < bookedTo && newTo > bookedFrom) {
				return false;
			}
		}
		return true;
	}

	// Xử lý đặt phòng
	async function handleBooking() {
		// Kiểm tra đầy đủ thông tin hay không
		if (
			!data.selectedRoom ||
			!data.selectedDate ||
			!data.timeFrom ||
			!data.timeTo ||
			!data.bookedBy ||
			!data.purpose
		) {
			setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin!" });
			return;
		}

		// Kiểm tra thời gian kết thúc phải lớn hơn thời gian bắt đầu
		if (data.timeFrom >= data.timeTo) {
			setMessage({
				type: "error",
				text: "Thời gian kết thúc phải sau thời gian bắt đầu!",
			});
			return;
		}

		// Kiểm tra giờ làm việc
		// const fromMinutes = timeToMinutes(data.timeFrom);
		// const toMinutes = timeToMinutes(data.timeTo);
		// const workStartMinutes = 8 * 60; // 8:00 = 480 phút
		// const workEndMinutes = 17 * 60 + 30; // 17:30 = 1050 phút

		// if (fromMinutes < workStartMinutes || toMinutes > workEndMinutes) {
		// 	setMessage({
		// 		type: "error",
		// 		text: "Chỉ được đặt phòng trong khung giờ 8:00 - 17:30!",
		// 	});
		// 	return;
		// }

		// Kiểm tra khung giờ có trống hay không
		if (!isTimeSlotAvailable(data.timeFrom, data.timeTo)) {
			setMessage({ type: "error", text: "Khung giờ này đã được đặt!" });
			return;
		}

		setLoading(true);
		setMessage({ type: "", text: "" });

		try {
			// Dùng GET với query params để tránh CORS preflight
			const params = new URLSearchParams({
				action: "addBooking",
				room: data.selectedRoom,
				date: data.selectedDate,
				timeFrom: data.timeFrom,
				timeTo: data.timeTo,
				bookedBy: data.bookedBy,
				purpose: data.purpose,
			});

			const response = await fetch(`${WEBAPP_URL}?${params.toString()}`);
			const responseData = await response.json();

			if (responseData.success) {
				setMessage({ type: "success", text: "Đặt phòng thành công!" });

				// Reset các trường
				setData((prevData) => ({
					...prevData,
					timeFrom: "09:00",
					timeTo: "10:00",
					bookedBy: "",
					purpose: "",
				}));

				// Reload bookings
				fetchBookings();
			} else {
				setMessage({
					type: "error",
					text: responseData.message || "Đặt phòng thất bại!",
				});
			}
		} catch (error: any) {
			setMessage({ type: "error", text: "Lỗi: " + error.message });
		} finally {
			setLoading(false);
		}
	}

	const handleDataChanged = (name: string, value: string) => {
		setData((prevData) => ({
			...prevData,
			[name]: value,
		}));
	};

	return (
		<div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4'>
			<div className='max-w-6xl mx-auto'>
				{/* Header */}
				<div className='bg-white rounded-lg shadow-lg p-6 mb-6 flex flex-col items-center justify-center'>
					<h1 className='text-3xl text-center font-bold text-gray-800 mb-2 uppercase'>
						Hệ thống đặt phòng họp SmartAds
					</h1>
					<p className='text-gray-600'>Chọn phòng và thời gian để đặt lịch</p>
				</div>

				<div className='grid md:grid-cols-2 gap-6'>
					{/* Form đặt phòng */}
					<div className='bg-white rounded-lg shadow-lg p-6'>
						<h2 className='text-xl font-bold text-gray-800 mb-4'>
							📝 Đặt phòng mới
						</h2>

						<div className='space-y-4'>
							{/* Chọn phòng */}
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									🏢 Chọn phòng
								</label>
								<select
									value={data.selectedRoom}
									onChange={(e) =>
										handleDataChanged("selectedRoom", e.target.value)
									}
									className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
									<option value=''>-- Chọn phòng --</option>
									{rooms.map((room, index) => (
										<option key={index} value={room}>
											{room}
										</option>
									))}
								</select>
							</div>

							{/* Chọn ngày */}
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									<Calendar className='inline w-4 h-4 mr-1' />
									Chọn ngày
								</label>
								<input
									type='date'
									value={data.selectedDate}
									min={getTodayDate()}
									onChange={(e) =>
										handleDataChanged("selectedDate", e.target.value)
									}
									className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							{/* Thời gian */}
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										<Clock className='inline w-4 h-4 mr-1' />
										Từ
									</label>
									<input
										type='time'
										value={data.timeFrom}
										onChange={(e) =>
											handleDataChanged("timeFrom", e.target.value)
										}
										className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										<Clock className='inline w-4 h-4 mr-1' />
										Đến
									</label>
									<input
										type='time'
										value={data.timeTo}
										onChange={(e) =>
											handleDataChanged("timeTo", e.target.value)
										}
										className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									/>
								</div>
							</div>

							{/* Người đặt */}
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									<User className='inline w-4 h-4 mr-1' />
									Người đặt
								</label>
								<input
									type='text'
									value={data.bookedBy}
									onChange={(e) =>
										handleDataChanged("bookedBy", e.target.value)
									}
									placeholder='Nhập tên người đặt'
									className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							{/* Mục đích */}
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									<FileText className='inline w-4 h-4 mr-1' />
									Mục đích
								</label>
								<textarea
									value={data.purpose}
									onChange={(e) => handleDataChanged("purpose", e.target.value)}
									placeholder='Họp team, training, phỏng vấn...'
									rows={3}
									className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
								/>
							</div>

							{/* Message */}
							{message.text && (
								<div
									className={`p-4 rounded-lg flex items-start gap-2 ${
										message.type === "success"
											? "bg-green-50 text-green-800 border border-green-200"
											: "bg-red-50 text-red-800 border border-red-200"
									}`}>
									{message.type === "success" ? (
										<CheckCircle className='w-5 h-5 shrink-0 mt-0.5' />
									) : (
										<XCircle className='w-5 h-5 shrink-0 mt-0.5' />
									)}
									<span>{message.text}</span>
								</div>
							)}

							{/* Submit button */}
							<button
								onClick={handleBooking}
								disabled={loading}
								className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2'>
								{loading ? (
									<>
										<Loader className='w-5 h-5 animate-spin' />
										Đang xử lý...
									</>
								) : (
									<>
										<CheckCircle className='w-5 h-5' />
										Đặt phòng
									</>
								)}
							</button>
						</div>
					</div>

					{/* Danh sách booking */}
					<div className='bg-white rounded-lg shadow-lg p-6'>
						<h2 className='text-xl font-bold text-gray-800 mb-4'>
							📅 Lịch đã đặt
						</h2>

						{!data.selectedRoom || !data.selectedDate ? (
							<div className='text-center py-12 text-gray-500'>
								<Calendar className='w-16 h-16 mx-auto mb-4 opacity-50' />
								<p>Vui lòng chọn phòng và ngày để xem lịch</p>
							</div>
						) : loading ? (
							<div className='text-center py-12'>
								<Loader className='w-12 h-12 mx-auto animate-spin text-blue-600' />
								<p className='text-gray-600 mt-4'>Đang tải...</p>
							</div>
						) : bookings.length === 0 ? (
							<div className='text-center py-12 text-gray-500'>
								<CheckCircle className='w-16 h-16 mx-auto mb-4 text-green-500 opacity-50' />
								<p>Chưa có lịch đặt nào</p>
								<p className='text-sm mt-2'>Phòng còn trống cả ngày!</p>
							</div>
						) : (
							<div className='space-y-3 max-h-[600px] overflow-y-auto'>
								{bookings.map((booking, index) => (
									<div
										key={index}
										className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors'>
										<div className='flex justify-between items-start mb-2'>
											<span className='font-semibold text-gray-800'>
												{booking.timeFrom} - {booking.timeTo}
											</span>
											<span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
												Đã đặt
											</span>
										</div>
										<div className='text-sm text-gray-600 space-y-1'>
											<p>
												👤 <strong>Người đặt:</strong> {booking.bookedBy}
											</p>
											<p>
												📝 <strong>Mục đích:</strong> {booking.purpose}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
