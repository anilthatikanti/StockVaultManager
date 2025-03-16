export interface IFile {
    _id: string;
    file: {
      _id: string;
      fileType: string;
      size: number;
      fileName: string;
      key?: string; // Optional
    };
    fileUrl: string;
    uploadedAt: Date;
    updatedAt: Date;
    copiedCount: number;
    parentFolderId: string; // MongoDB ObjectId as string
    previousParentFolderId?: string | null; // MongoDB ObjectId as string
  }