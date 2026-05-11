import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Smile,
  ImageIcon,
  Paperclip,
  Sun,
  Moon,
  ThumbsUp,
  LogOut,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Virtuoso } from "react-virtuoso";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import api from "@/api/api";
import { getEchoInstance } from "./echo"; // Mở comment này khi Reverb đã chạy

// --- COMPONENT XỬ LÝ ẢNH BẢO MẬT (PRIVATE IMAGE) ---
const PrivateImage = ({
  messageId,
  fileName,
}: {
  messageId: number;
  fileName: string;
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Gọi API download để lấy file nhị phân (Blob) có đính kèm Token
    api
      .post(
        `/chat/messages/${messageId}/download`,
        {},
        { responseType: "blob" },
      )
      .then((response) => {
        const url = URL.createObjectURL(response.data);
        setImageSrc(url);
      })
      .catch((error) => console.error("Lỗi tải ảnh:", error));

    // Cleanup URL để tránh tràn RAM
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [messageId]);

  if (!imageSrc) {
    return (
      <div className="w-[200px] h-[150px] bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl flex items-center justify-center text-xs text-zinc-500">
        Đang tải ảnh...
      </div>
    );
  }

  return (
    <div className="relative group/image rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white p-1 inline-block">
      <img
        src={imageSrc}
        alt={fileName}
        className="max-w-[250px] rounded-xl object-cover"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full shadow"
          onClick={() => window.open(imageSrc, "_blank")}
          title="Xem chi tiết"
        >
          <Eye size={16} />
        </Button>
        <Button
          size="icon"
          className="h-8 w-8 rounded-full shadow bg-blue-600 hover:bg-blue-700 text-white"
          onClick={(e) => {
            e.stopPropagation();
            const link = document.createElement("a");
            link.href = imageSrc;
            link.download = fileName;
            link.click();
          }}
          title="Tải xuống"
        >
          <Download size={16} />
        </Button>
      </div>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => {
    const savedUser = localStorage.getItem("current_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // STATE ĐÓNG MỞ SIDEBAR TRÁI
  const [isListOpen, setIsListOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const virtuosoRef = useRef<any>(null);

  useEffect(() => {
    if (!localStorage.getItem("access_token") || !currentUser)
      navigate("/login");
  }, [navigate, currentUser]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get("/chat/conversations");
        const fetchedConvos = response.data?.data?.data || [];
        setConversations(fetchedConvos);
        if (fetchedConvos.length > 0 && !selectedContact)
          setSelectedContact(fetchedConvos[0]);
      } catch (error: any) {
        if (error.response?.status === 401) handleLogout();
      }
    };
    fetchConversations();
  }, []);

  const getConversationDetails = (convoItem: any) => {
    const otherParticipant = convoItem.conversation?.participants?.find(
      (p: any) => p.messageable_id !== currentUser?.id,
    );
    const name = otherParticipant?.messageable?.name || "Người dùng";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    return { name, avatar };
  };

  useEffect(() => {
    if (!selectedContact) return;
    const fetchMessages = async () => {
      try {
        const response = await api.get("/chat/messages", {
          params: { conversation_id: selectedContact.conversation_id },
        });
        const fetched = response.data?.data?.data || [];
        setMessages(fetched.reverse());
      } catch (error) {
        toast.error("Không thể tải tin nhắn");
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

  useEffect(() => {
    if (!selectedContact) return;
    const echo = getEchoInstance();
    const channelName = `conversation.${selectedContact.conversation_id}`;
    const channel = echo.private(channelName);

    channel.listen(".message.sent", (newMsgDTO: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsgDTO.id)) return prev; // Tránh lặp tin nhắn
        return [...prev, newMsgDTO];
      });
    });

    return () => {
      channel.stopListening(".message.sent");
      echo.leaveChannel(channelName);
    };
  }, [selectedContact]);

  const handleSendText = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    const textToSend = newMessage.trim() ? newMessage.trim() : "👍";
    setNewMessage("");
    setShowEmojiPicker(false);

    try {
      const response = await api.post("/chat/messages", {
        conversation_id: selectedContact.conversation_id,
        body: textToSend,
      });
      setMessages((prev) => [...prev, response.data.data]);
    } catch (error) {
      toast.error("Gửi tin nhắn thất bại");
    }
  };

  const uploadFiles = async (file: File) => {
    setIsUploading(true);
    const toastId = toast.loading("Đang gửi...");
    const formData = new FormData();
    formData.append("conversation_id", String(selectedContact.conversation_id));
    formData.append("files[]", file);

    try {
      const response = await api.post("/chat/messages/upload", formData);
      const newMsgs = response.data?.data || [];
      setMessages((prev) => [...prev, ...newMsgs]); // Update file lên UI ngay lập tức
      toast.success("Đã gửi!", { id: toastId });
    } catch (error: any) {
      toast.error("Lỗi gửi file!", { id: toastId });
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

  const handleDownloadFile = async (messageId: number, fileName: string) => {
    const toastId = toast.loading("Đang tải...");
    try {
      const response = await api.post(
        `/chat/messages/${messageId}/download`,
        {},
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "tai_lieu";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Tải xong!", { id: toastId });
    } catch (error) {
      toast.error("Lỗi tải file.", { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const currentContactInfo = selectedContact
    ? getConversationDetails(selectedContact)
    : null;

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
        <div className="sidebar flex flex-col border-r dark:border-zinc-800 bg-white dark:bg-zinc-900 w-[320px] transition-all duration-300">
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

          {/* THANH ĐÓNG/MỞ HỘI THOẠI */}
          <div
            className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => setIsListOpen(!isListOpen)}
          >
            <span className="font-semibold text-sm text-zinc-500 uppercase tracking-wider">
              Hội thoại gần đây
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isListOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </Button>
          </div>

          {/* DANH SÁCH KHÁCH HÀNG */}
          <div
            className={`flex-1 overflow-hidden transition-all duration-300 ${isListOpen ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0"}`}
          >
            <ScrollArea className="h-full">
              {conversations.map((c) => {
                const details = getConversationDetails(c);
                const isSelected =
                  selectedContact?.conversation_id === c.conversation_id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className={`p-3 mx-2 mt-1 flex items-center gap-3 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
                  >
                    <Avatar>
                      <AvatarImage src={details.avatar} />
                    </Avatar>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span
                        className={`font-semibold text-[15px] truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}
                      >
                        {details.name}
                      </span>
                      <span className="text-xs text-zinc-500 truncate">
                        {c.conversation?.last_message?.body ||
                          "Chưa có tin nhắn"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>

        {/* KHUNG CHAT */}
        <div className="chat-container flex-1 flex flex-col dark:bg-zinc-950">
          {currentContactInfo && (
            <div className="h-[70px] border-b dark:border-zinc-800 flex items-center px-4 justify-between bg-white dark:bg-zinc-900 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={currentContactInfo.avatar} />
                </Avatar>
                <h2 className="font-bold text-[16px] dark:text-white">
                  {currentContactInfo.name}
                </h2>
              </div>
            </div>
          )}

          <div
            className="flex-1 overflow-hidden bg-[#F0F2F5] dark:bg-zinc-950"
            onClick={() => setShowEmojiPicker(false)}
          >
            {selectedContact ? (
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                itemContent={(_, msg) => {
                  const senderId =
                    msg.senderId ||
                    msg.sender?.id ||
                    msg.participation?.messageable_id;
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
                        {!isMe && (
                          <Avatar className="w-8 h-8 mb-1 flex-shrink-0 shadow-sm">
                            <AvatarImage src={avatarUrl} />
                          </Avatar>
                        )}
                        <div
                          className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          {!isMe && (
                            <span className="text-xs text-zinc-500 mb-1 ml-1">
                              {senderName}
                            </span>
                          )}

                          <div
                            className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {/* RENDER ẢNH HOẶC FILE TỪ DTO */}
                            {msg.type === "image" ? (
                              <PrivateImage
                                messageId={msg.id}
                                fileName={
                                  msg.data?.original_name || "image.png"
                                }
                              />
                            ) : msg.type === "file" ? (
                              <div
                                onClick={() =>
                                  handleDownloadFile(
                                    msg.id,
                                    msg.data?.original_name,
                                  )
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

                            {/* Menu Thả tim */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-zinc-800 rounded-full shadow border p-1 cursor-pointer">
                              <button
                                onClick={() =>
                                  handleToggleReaction(msg.id, "❤️")
                                }
                                className="hover:scale-125 transition-transform text-lg"
                              >
                                ❤️
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleReaction(msg.id, "😆")
                                }
                                className="hover:scale-125 transition-transform text-lg"
                              >
                                😆
                              </button>
                            </div>
                          </div>

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
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Hãy chọn một cuộc trò chuyện để bắt đầu
              </div>
            )}
          </div>

          {selectedContact && (
            <div className="p-3 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
              <form
                onSubmit={handleSendText}
                className="flex gap-2 items-center"
              >
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
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
