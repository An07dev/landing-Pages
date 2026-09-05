import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Lấy thông tin chi tiết 1 đơn hàng theo ID hoặc orderCode
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const order = await Order.findOne({
      $or: [...(isObjectId ? [{ _id: id }] : []), { orderCode: id }],
    }).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tra cứu đơn hàng', error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Cập nhật trạng thái đơn hàng (thanh toán, vận chuyển, trackingCode, notes)
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { paymentStatus, shippingStatus, shippingCarrier, trackingCode, notes } = body;

    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const updateData: Record<string, any> = {};

    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (shippingStatus) updateData.shippingStatus = shippingStatus;
    if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;
    if (trackingCode !== undefined) updateData.trackingCode = trackingCode;
    if (notes !== undefined) updateData.notes = notes;

    const updatedOrder = await Order.findOneAndUpdate(
      { $or: [...(isObjectId ? [{ _id: id }] : []), { orderCode: id }] },
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng để cập nhật' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: updatedOrder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi cập nhật đơn hàng', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa hoặc hủy đơn hàng
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const deletedOrder = await Order.findOneAndDelete({
      $or: [...(isObjectId ? [{ _id: id }] : []), { orderCode: id }],
    });

    if (!deletedOrder) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng để xóa' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa đơn hàng thành công',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xóa đơn hàng', error: error.message },
      { status: 500 }
    );
  }
}
