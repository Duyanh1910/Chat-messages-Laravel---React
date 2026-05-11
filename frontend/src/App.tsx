import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Send,
  Smile,
  ImageIcon,
  Paperclip,
  Phone,
  Video,
  Sun,
  Moon,
  ThumbsUp,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Virtuoso } from "react-virtuoso";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import "./App.css";
import api from "@/api/api";

// --- CẤU HÌNH AXIOS ---
// Tự động nhét Token vào

const initialContacts = [
  {
    id: 4,
    name: "Nhóm Đồ Án",
    avatar:
      "https://ui-avatars.com/api/?name=Nhóm+Đồ+Án&background=0D8ABC&color=fff",
    online: true,
  },
];

export default function App() {
  const navigate = useNavigate();

  const [currentUser] = useState(() => {
    const savedUser = localStorage.getItem("current_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState(initialContacts[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const virtuosoRef = useRef<any>(null);

  // Ép đăng nhập nếu chưa có token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !currentUser) navigate("/login");
  }, [navigate, currentUser]);

  // Load tin nhắn
  useEffect(() => {
    if (!selectedContact) return;
    const fetchMessages = async () => {
      try {
        const response = await api.get("/chat/messages", {
          params: { conversation_id: selectedContact.id },
        });
        const fetched = response.data?.data?.data || [];
        setMessages(fetched.reverse());
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn!");
          handleLogout();
        }
      }
    };
    fetchMessages();
  }, [selectedContact]);

  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: "end",
      });
    }
  }, [messages.length]);

  // SỬA LỖI NÚT LIKE & GỬI TIN
  const handleSendText = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();

    // Nếu rỗng -> Gửi Like. Nếu có chữ -> Gửi chữ
    const textToSend = newMessage.trim() ? newMessage.trim() : "👍";

    setNewMessage(""); // Reset ô input ngay lập tức
    setShowEmojiPicker(false);

    try {
      const response = await api.post("/chat/messages", {
        conversation_id: selectedContact.id,
        body: textToSend,
      });
      setMessages((prev) => [...prev, response.data.data]);
    } catch (error) {
      toast.error("Gửi tin nhắn thất bại");
    }
  };

  // SỬA CÁCH UPLOAD ĐỂ TRÁNH LỖI BACKEND
  const uploadFiles = async (file: File) => {
    setIsUploading(true);
    const toastId = toast.loading("Đang gửi file...");

    const formData = new FormData();
    formData.append("conversation_id", String(selectedContact.id));
    formData.append("files[]", file);

    try {
      const response = await api.post("/chat/messages/upload", formData); // Route chính xác
      const newMsgs = response.data?.data || [];
      setMessages((prev) => [...prev, ...newMsgs]);
      toast.success("Gửi thành công!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error("Lỗi gửi file! Hãy kiểm tra log Backend.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleToggleReaction = async (messageId: number, reaction: string) => {
    try {
      const response = await api.post(`/chat/messages/${messageId}/reactions`, {
        reaction,
      });
      const summary = response.data.data.summary;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, reactions_summary: summary } : m,
        ),
      );
    } catch (error) {
      toast.error("Lỗi thả cảm xúc");
    }
  };
  const handleDownload = async (messageId: number, fileName: string) => {
    const toastId = toast.loading("Đang tải file...");
    try {
      // Gọi API download mà bạn đã viết ở Backend
      const response = await api.post(
        `/chat/messages/${messageId}/download`,
        {},
        { responseType: "blob" },
      );

      // Tạo một URL ảo từ luồng dữ liệu (blob) và ép trình duyệt tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "tai_lieu");
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Tải xong!", { id: toastId });
    } catch (error) {
      toast.error("Lỗi tải file", { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <TooltipProvider>
      <div className={`app-wrapper ${isDarkMode ? "dark" : ""}`}>
        <Toaster position="top-center" />

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) =>
            e.target.files?.[0] && uploadFiles(e.target.files[0])
          }
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={(e) =>
            e.target.files?.[0] && uploadFiles(e.target.files[0])
          }
          className="hidden"
        />

        {/* SIDEBAR */}
        <div className="sidebar flex flex-col border-r dark:border-zinc-800 bg-white dark:bg-zinc-900 w-[320px]">
          <div className="p-4 flex justify-between items-center border-b dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10 border shadow-sm">
                <AvatarImage
                  src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`}
                />
              </Avatar>
              <h1 className="text-lg font-bold dark:text-white">Đoạn chat</h1>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut size={18} className="text-red-500" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {initialContacts.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className={`p-3 mx-2 mt-2 flex items-center gap-3 rounded-xl cursor-pointer transition-all ${selectedContact.id === c.id ? "bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
              >
                <Avatar>
                  <AvatarImage src={c.avatar} />
                </Avatar>
                <span
                  className={`font-semibold text-[15px] ${selectedContact.id === c.id ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}
                >
                  {c.name}
                </span>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* KHUNG CHAT TÍNH NĂNG */}
        <div className="chat-container flex-1 flex flex-col dark:bg-zinc-950">
          <div className="h-[70px] border-b dark:border-zinc-800 flex items-center px-4 justify-between bg-white dark:bg-zinc-900 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedContact.avatar} />
              </Avatar>
              <h2 className="font-bold text-[16px] dark:text-white">
                {selectedContact.name}
              </h2>
            </div>
          </div>

          <div
            className="flex-1 overflow-hidden bg-[#F0F2F5] dark:bg-zinc-950"
            onClick={() => setShowEmojiPicker(false)}
          >
            <Virtuoso
              ref={virtuosoRef}
              data={messages}
              itemContent={(_, msg) => {
                const senderId =
                  msg.sender?.id || msg.participation?.messageable_id;
                const isMe = senderId === currentUser?.id;
                const senderName = msg.sender?.name || "Người dùng";
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random&color=fff`;

                return (
                  <div
                    className={`flex w-full px-4 py-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`group flex items-end gap-2 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar người gửi (Chỉ hiện nếu không phải là mình) */}
                      {!isMe && (
                        <Avatar className="w-8 h-8 mb-1 flex-shrink-0 shadow-sm">
                          <AvatarImage src={avatarUrl} />
                        </Avatar>
                      )}

                      <div
                        className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {/* Tên người gửi */}
                        {!isMe && (
                          <span className="text-xs text-zinc-500 mb-1 ml-1">
                            {senderName}
                          </span>
                        )}

                        <div
                          className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Nội dung */}
                          {msg.type === "image" ? (
                            <div className="rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white p-1">
                              <img
                                src={msg.data?.file_url}
                                alt="attachment"
                                className="max-w-[250px] rounded-xl cursor-pointer hover:opacity-90"
                                onClick={() =>
                                  window.open(msg.data?.file_url, "_blank")
                                }
                              />
                            </div>
                          ) : msg.type === "file" ? (
                            // GIAO DIỆN HIỂN THỊ TỆP ĐÍNH KÈM
                            <div
                              onClick={() =>
                                handleDownload(msg.id, msg.data?.original_name)
                              }
                              className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer shadow-sm hover:opacity-90 transition-opacity ${isMe ? "bg-[#0084FF] text-white" : "bg-white dark:bg-zinc-800 dark:text-zinc-100 border"}`}
                            >
                              <div className="bg-black/10 p-2 rounded-full">
                                <Paperclip size={18} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium underline text-sm truncate max-w-[200px]">
                                  {msg.data?.original_name || "Tệp đính kèm"}
                                </span>
                                <span className="text-[11px] opacity-70">
                                  Nhấp để tải xuống
                                </span>
                              </div>
                            </div>
                          ) : msg.body === "👍" ? (
                            <div className="text-5xl animate-bounce">
                              {msg.body}
                            </div>
                          ) : (
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-[15px] shadow-sm break-words ${isMe ? "bg-[#0084FF] text-white" : "bg-white dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700"}`}
                            >
                              {msg.body}
                            </div>
                          )}
                          {/* KẾT THÚC ĐOẠN RENDER NỘI DUNG */}

                          {/* Menu Thả tim (Chỉ hiện khi hover) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-zinc-800 rounded-full shadow border p-1 cursor-pointer">
                            <button
                              onClick={() => handleToggleReaction(msg.id, "❤️")}
                              className="hover:scale-125 transition-transform text-lg"
                            >
                              ❤️
                            </button>
                            <button
                              onClick={() => handleToggleReaction(msg.id, "😆")}
                              className="hover:scale-125 transition-transform text-lg"
                            >
                              😆
                            </button>
                          </div>
                        </div>

                        {/* Hiển thị Reaction */}
                        {msg.reactions_summary &&
                          Object.keys(msg.reactions_summary).length > 0 && (
                            <div
                              className={`flex gap-1 bg-white dark:bg-zinc-700 rounded-full px-2.5 py-0.5 shadow-md border border-zinc-100 text-[12px] absolute -bottom-3 ${isMe ? "right-2" : "left-2"} z-10`}
                            >
                              {Object.entries(msg.reactions_summary).map(
                                ([e, c]) => (
                                  <span key={e}>
                                    {e} {c as number}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {/* THANH NHẬP LIỆU (Input) */}
          <div className="p-3 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
            <form onSubmit={handleSendText} className="flex gap-2 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[#0084FF] rounded-full hover:bg-zinc-100"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={22} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[#0084FF] rounded-full hover:bg-zinc-100"
                disabled={isUploading}
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon size={22} />
              </Button>

              <div className="relative flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="w-full rounded-full bg-[#F0F2F5] dark:bg-zinc-800 border-none pl-4 pr-10 py-[22px] text-[15px]"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-1 top-1.5 text-[#0084FF] rounded-full hover:bg-zinc-200"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={22} />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-14 right-0 z-50 shadow-2xl">
                    <EmojiPicker
                      onEmojiClick={(o) => setNewMessage((p) => p + o.emoji)}
                      theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="text-[#0084FF] hover:bg-transparent"
                disabled={isUploading}
              >
                {newMessage.trim() ? (
                  <Send size={28} />
                ) : (
                  <ThumbsUp size={30} />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
