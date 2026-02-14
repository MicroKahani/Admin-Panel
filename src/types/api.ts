/**
 * TypeScript type definitions for API responses
 */

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface Admin {
    id: string;
    email: string;
    role: 'admin' | 'manager';
    permissions: {
        read: boolean;
        write: boolean;
        delete: boolean;
    };
    isActive?: boolean;
    createdAt?: string;
}

export interface OTPResponse {
    success: boolean;
    message: string;
    expiresIn?: number;
}

export interface VerifyOTPResponse {
    success: boolean;
    message: string;
    data: {
        admin: Admin;
    };
}

export interface Video {
    _id: string;
    title: string;
    description?: string;
    type: 'reel' | 'episode';
    videoUrl: string;
    thumbnailUrl?: string;
    views: number;
    likes: string[];
    comments: number;
    seasonId?: {
        _id: string;
        title: string;
    };
    isPublished: boolean;
    createdAt: string;
}

export interface Season {
    _id: string;
    title: string;
    description?: string;
    seasonNumber: number;
    thumbnailUrl?: string;
    episodeCount?: number;
    totalViews?: number;
    isPublished: boolean;
    createdAt: string;
}

export interface User {
    _id: string;
    email?: string;
    username?: string;
    isActive: boolean;
    isBlocked: boolean;
    isCommentBanned: boolean;
    createdAt: string;
}

export interface CarouselItem {
    _id: string;
    title: string;
    imageUrl: string;
    targetType: 'season' | 'video' | 'external';
    targetId?: string;
    externalUrl?: string;
    order: number;
    isActive: boolean;
}

export interface FcmCampaign {
    _id: string;
    title: string;
    body: string;
    imageUrl?: string;
    deepLink?: string;
    targetType: 'all_users' | 'by_user_ids' | 'by_tokens';
    sentCount: number;
    successCount: number;
    failureCount: number;
    createdAt: string;
}
