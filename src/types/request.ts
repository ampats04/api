import { ModeOfPayment } from "./enums";

export type ProductRequest = {
  name: string;
  description: string;
  stock: number;
  price: number;
  max_quantity: number;
  variations: string;
  thumbnail: number | File;
}

export type OrderRequest = {
  products_id: number,
  variations_id?: number,
  mode_of_payment: ModeOfPayment,
  quantity: number,
  student_id?: string,
  student_first_name?: string,
  student_last_name?: string,
  student_email?: string,
  student_course?: number,
  student_year?: number;
};

export type AnnouncementRequest = {
  title: string,
  content: string,
  photo_data?: string;
  photo_type?: string;
};

export type PhotoRequest = {
  type: string;
  data: Buffer;
  name?: string;
  reference?: string;
}

export type PaginationRequest = {
  sort_column?: string;
  sort_type?: 'ASC' | 'DESC';
  search_column?: string;
  search_value?: string;
  page?: string;
  limit?: string;
};