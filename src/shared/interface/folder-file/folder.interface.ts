export interface Folder {
    _id: string;
    createdAt: Date;
    files: any[]; // Assuming the 'files' property can contain any type of data
    isDeleted: boolean;
    name: string;
    parentFolderId: string | null;
    previousParentFolderId: string | null;
    updatedAt: Date;
    count: number;
}

