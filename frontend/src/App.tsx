import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send, Smile, ImageIcon, Paperclip, Sun, Moon, ThumbsUp,
  LogOut, ChevronDown, ChevronRight, Download, Eye, Search, Sticker, Menu, Edit, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Virtuoso } from "react-virtuoso";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import api from "@/api/api";
import { getEchoInstance } from "./echo";

const dummyGifs = [
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/yYSSBtDgbbRzq/giphy.gif",
  "https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif"
];

const PrivateImage = ({ messageId, fileName }: { messageId: number; fileName: string; }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    api.post(`/chat/messages/${messageId}/download`, {}, { responseType: "blob" })
      .then((response) => {
        const url = URL.createObjectURL(response.data);
        setImageSrc(url);
      })
      .catch((error) => console.error(error));

    return () => { if (imageSrc) URL.revokeObjectURL(imageSrc); };
  }, [messageId]);

  if (!imageSrc) {
    return <div className="image-loading">Đang tải ảnh...</div>;
  }

  return (
    <div className="group/image image-wrapper">
      <img src={imageSrc} alt={fileName} className="image-content" />
      <div className="image-overlay">
        <Button size="icon" variant="secondary" className="action-btn" onClick={() => window.open(imageSrc, "_blank")}>
          <Eye size={16} />
        </Button>
        <Button size="icon" className="action-btn action-btn-primary" onClick={(e) => {
          e.stopPropagation();
          const link = document.createElement("a");
          link.href = imageSrc;
          link.download = fileName;
          link.click();
        }}>
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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListOpen, setIsListOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const virtuosoRef = useRef<any>(null);
  const isAtBottomRef = useRef(true);
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    if (!localStorage.getItem("access_token") || !currentUser) navigate("/login");
  }, [navigate, currentUser]);

  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get("/chat/conversations");
        const fetchedConvos = response.data?.data?.data || [];
        setConversations(fetchedConvos);
        if (fetchedConvos.length > 0 && !selectedContact) setSelectedContact(fetchedConvos[0]);
      } catch (error: any) {
        if (error.response?.status === 401) handleLogout();
      }
    };
    fetchConversations();
  }, []);

  const getConversationDetails = (convoItem: any) => {
    const otherParticipant = convoItem.conversation?.participants?.find((p: any) => p.messageable_id !== currentUser?.id);
    const name = otherParticipant?.messageable?.name || "Người dùng";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    return { name, avatar };
  };

  const filteredConversations = conversations.filter((c) => {
    const details = getConversationDetails(c);
    return details.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const updateSidebar = (conversationId: number, newMsg: any) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.conversation_id === conversationId);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        conversation: {
          ...(updated[index].conversation || {}),
          last_message: newMsg,
        },
      };
      const [moved] = updated.splice(index, 1);
      updated.unshift(moved);
      return updated;
    });
  };

  useEffect(() => {
    if (!selectedContact) return;
    
    setMessages([]);
    prevMessagesLength.current = 0;

    const fetchMessages = async () => {
      try {
        const response = await api.get("/chat/messages", { params: { conversation_id: selectedContact.conversation_id } });
        const fetched = response.data?.data?.data || [];
        setMessages(fetched.reverse());
      } catch (error) {
        toast.error("Không thể tải tin nhắn");
      }
    };
    fetchMessages();
  }, [selectedContact]);

  useEffect(() => {
    if (messages.length === 0) return;

    const isInitialLoad = prevMessagesLength.current === 0;

    if (isInitialLoad) {
      setIsAtBottom(true);
      isAtBottomRef.current = true;
      setShowNewMessageAlert(false);
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: "end", behavior: "auto" });
      });
    } else if (messages.length > prevMessagesLength.current) {
      const lastMsg = messages[messages.length - 1];
      const senderId = lastMsg?.senderId || lastMsg?.sender?.id || lastMsg?.participation?.messageable_id;
      const isMe = senderId === currentUser?.id;

      if (isMe) {
        setIsAtBottom(true);
        isAtBottomRef.current = true;
        setShowNewMessageAlert(false);
        setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: "end", behavior: "smooth" });
        }, 50);
      } else if (!isAtBottomRef.current) {
        setShowNewMessageAlert(true);
      } else {
        setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: "end", behavior: "smooth" });
        }, 50);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, currentUser]);

  useEffect(() => {
    if (!selectedContact) return;
    const echo = getEchoInstance();
    const channelName = `conversation.${selectedContact.conversation_id}`;
    const channel = echo.private(channelName);

    channel.listen(".message.sent", (newMsgDTO: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsgDTO.id)) return prev;
        return [...prev, newMsgDTO];
      });
      updateSidebar(selectedContact.conversation_id, newMsgDTO);
    });

    return () => {
      channel.stopListening(".message.sent");
      echo.leaveChannel(channelName);
    };
  }, [selectedContact]);

  const scrollToBottomAction = () => {
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    setShowNewMessageAlert(false);
    setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({ index: 999999, align: "end", behavior: "smooth" });
    }, 50);
  };

  const handleSendText = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    const textToSend = newMessage.trim() ? newMessage.trim() : "👍";
    setNewMessage("");
    setShowEmojiPicker(false);
    scrollToBottomAction();

    try {
      const response = await api.post("/chat/messages", {
        conversation_id: selectedContact.conversation_id,
        body: textToSend,
      });
      const sentMsg = response.data.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      updateSidebar(selectedContact.conversation_id, sentMsg);
    } catch (error) {
      toast.error("Gửi tin nhắn thất bại");
    }
  };

  const handleSelectGif = async (gifUrl: string) => {
    setShowGifPicker(false);
    scrollToBottomAction();
    
    try {
      const response = await api.post("/chat/messages", {
        conversation_id: selectedContact.conversation_id,
        body: gifUrl,
        type: "gif" 
      });
      const sentMsg = response.data.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      updateSidebar(selectedContact.conversation_id, sentMsg);
    } catch (error) {
      toast.error("Lỗi gửi GIF");
    }
  };

  const uploadFiles = async (file: File) => {
    setIsUploading(true);
    scrollToBottomAction();
    const toastId = toast.loading("Đang gửi...");
    const formData = new FormData();
    formData.append("conversation_id", String(selectedContact.conversation_id));
    formData.append("files[]", file);

    try {
      const response = await api.post("/chat/messages/upload", formData);
      const newMsgs = response.data?.data || [];
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = newMsgs.filter((m: any) => !existingIds.has(m.id));
        return [...prev, ...toAdd];
      });
      if (newMsgs.length > 0) {
        updateSidebar(selectedContact.conversation_id, newMsgs[newMsgs.length - 1]);
      }
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
      const response = await api.post(`/chat/messages/${messageId}/reactions`, { reaction });
      const summary = response.data.data.summary;
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions_summary: summary } : m));
    } catch (error) {
      toast.error("Lỗi thả cảm xúc");
    }
  };

  const handleDownloadFile = async (messageId: number, fileName: string) => {
    const toastId = toast.loading("Đang tải...");
    try {
      const response = await api.post(`/chat/messages/${messageId}/download`, {}, { responseType: "blob" });
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

  const currentContactInfo = selectedContact ? getConversationDetails(selectedContact) : null;

  const renderSidebarContent = () => (
    <>
      <div className="sidebar-header">
        <div className="sidebar-title-wrapper">
          <Button variant="ghost" size="icon" className="hidden md:flex -ml-2 mr-1" onClick={() => setIsSidebarOpen(false)}>
            <Menu className="h-5 w-5 dark:text-white" />
          </Button>
          <Avatar className="sidebar-avatar">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`} />
          </Avatar>
          <h1 className="sidebar-title">Đoạn chat</h1>
        </div>
        <div className="sidebar-actions">
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut size={18} className="text-red-500" />
          </Button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <Input
            placeholder="Tìm kiếm hội thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="recent-chats-header" onClick={() => setIsListOpen(!isListOpen)}>
        <span className="recent-chats-title">Hội thoại gần đây</span>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isListOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>

      <div className={`contact-list-wrapper ${isListOpen ? "contact-list-open" : "contact-list-closed"}`}>
        <ScrollArea className="h-full">
          {filteredConversations.map((c) => {
            const details = getConversationDetails(c);
            const isSelected = selectedContact?.conversation_id === c.conversation_id;
            const lastMsg = c.conversation?.last_message;
            let lastMsgText = "Chưa có tin nhắn";
            
            if (lastMsg) {
              const senderId = lastMsg.senderId || lastMsg.sender?.id || lastMsg.participation?.messageable_id;
              const isMe = senderId === currentUser?.id;
              const body = lastMsg.body || "";
              const isGif = lastMsg.type === "gif" || (typeof body === 'string' && body.includes('giphy.com'));
              
              if (lastMsg.type === "image") {
                lastMsgText = isMe ? "Đã gửi ảnh" : "Đã nhận ảnh";
              } else if (lastMsg.type === "file") {
                lastMsgText = isMe ? "Đã gửi tệp" : "Đã nhận tệp";
              } else if (isGif) {
                lastMsgText = isMe ? "Đã gửi GIF" : "Đã nhận GIF";
              } else {
                lastMsgText = isMe ? `Bạn: ${body}` : body;
              }
            }

            return (
              <div key={c.id} onClick={() => setSelectedContact(c)} className={`contact-item ${isSelected ? "contact-item-active" : ""}`}>
                <Avatar>
                  <AvatarImage src={details.avatar} />
                </Avatar>
                <div className="contact-info">
                  <span className="contact-name">{details.name}</span>
                  <span className="contact-last-msg">
                    {lastMsgText}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredConversations.length === 0 && (
            <div className="empty-state">Không tìm thấy kết quả</div>
          )}
        </ScrollArea>
      </div>
    </>
  );

  const renderMiniSidebar = () => (
    <div className="w-[72px] flex flex-col items-center py-4 h-full">
      <Button variant="ghost" size="icon" className="mb-4" onClick={() => setIsSidebarOpen(true)}>
        <Menu className="h-6 w-6 dark:text-zinc-300" />
      </Button>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-full">
            <Edit className="h-4 w-4 dark:text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Tin nhắn mới</TooltipContent>
      </Tooltip>

      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col items-center gap-4 mt-2">
          {filteredConversations.map((c) => {
            const details = getConversationDetails(c);
            const isSelected = selectedContact?.conversation_id === c.conversation_id;
            return (
              <Tooltip key={c.id}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar 
                      className={`w-10 h-10 cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900" : "hover:opacity-80"}`} 
                      onClick={() => setSelectedContact(c)}
                    >
                      <AvatarImage src={details.avatar} />
                    </Avatar>
                    {c.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-zinc-900">
                        {c.unreadCount}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{details.name}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </ScrollArea>

      <div className="mt-auto flex flex-col gap-3 pt-4 items-center border-t dark:border-zinc-800 w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Giao diện</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut size={20} className="text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Đăng xuất</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className={`app-wrapper ${isDarkMode ? "dark" : ""}`}>
        <Toaster position="top-center" />
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && uploadFiles(e.target.files[0])} className="hidden" />
        <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => e.target.files?.[0] && uploadFiles(e.target.files[0])} className="hidden" />

        <div className={`sidebar ${isSidebarOpen ? "sidebar-open" : "sidebar-mini"}`}>
          {isSidebarOpen ? (
            <div className="sidebar-content-wrapper">
              {renderSidebarContent()}
            </div>
          ) : (
            renderMiniSidebar()
          )}
        </div>

        <div className="chat-container">
          {currentContactInfo && (
            <div className="chat-header">
              <div className="chat-header-info">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5 dark:text-white" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[300px] flex flex-col bg-white dark:bg-zinc-900 border-r dark:border-zinc-800 overflow-hidden">
                    <div className="flex flex-col h-full w-full">
                      {renderSidebarContent()}
                    </div>
                  </SheetContent>
                </Sheet>

                {!isSidebarOpen && (
                  <Button variant="ghost" size="icon" className="hidden md:flex mr-1" onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="h-5 w-5 dark:text-white" />
                  </Button>
                )}

                <Avatar>
                  <AvatarImage src={currentContactInfo.avatar} />
                </Avatar>
                <h2 className="chat-header-name">{currentContactInfo.name}</h2>
              </div>
            </div>
          )}

          <div className="chat-body" onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); }}>
            {selectedContact ? (
              <>
                <Virtuoso
                  ref={virtuosoRef}
                  data={messages}
                  initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
                  followOutput={(isAtBottom) => isAtBottom ? "smooth" : false}
                  atBottomStateChange={(bottom) => {
                    setIsAtBottom(bottom);
                    if (bottom) setShowNewMessageAlert(false);
                  }}
                  itemContent={(_, msg) => {
                    const senderId = msg.senderId || msg.sender?.id || msg.participation?.messageable_id;
                    const isMe = senderId === currentUser?.id;
                    const senderName = msg.sender?.name || "Người dùng";
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random&color=fff`;

                    return (
                      <div className={`msg-row ${isMe ? "msg-row-me" : "msg-row-other"}`}>
                        <div className={`group msg-content-wrapper ${isMe ? "msg-content-me" : "msg-content-other"}`}>
                          {!isMe && (
                            <Avatar className="msg-avatar">
                              <AvatarImage src={avatarUrl} />
                            </Avatar>
                          )}
                          <div className={`msg-inner ${isMe ? "msg-inner-me" : "msg-inner-other"}`}>
                            {!isMe && <span className="msg-sender-name">{senderName}</span>}

                            <div className={`msg-body-container ${isMe ? "msg-body-container-me" : "msg-body-container-other"}`}>
                              {msg.type === "image" ? (
                                <PrivateImage messageId={msg.id} fileName={msg.data?.original_name || "image.png"} />
                              ) : msg.type === "file" ? (
                                <div onClick={() => handleDownloadFile(msg.id, msg.data?.original_name)} className={`msg-file ${isMe ? "msg-bubble-me" : "msg-bubble-other"}`}>
                                  <div className="msg-file-icon">
                                    <Paperclip size={18} />
                                  </div>
                                  <div className="msg-file-details">
                                    <span className="msg-file-name">{msg.data?.original_name || "Tệp đính kèm"}</span>
                                    <span className="msg-file-hint">Nhấp để tải xuống</span>
                                  </div>
                                </div>
                              ) : msg.type === "gif" || (typeof msg.body === 'string' && msg.body.includes('giphy.com')) ? (
                                 <div className="msg-gif">
                                    <img src={msg.body} alt="sent gif" className="msg-gif-img" />
                                 </div>
                              ) : msg.body === "👍" ? (
                                <div className="msg-emoji">{msg.body}</div>
                              ) : (
                                <div className={`msg-bubble ${isMe ? "msg-bubble-me" : "msg-bubble-other"}`}>{msg.body}</div>
                              )}

                              <div className="msg-reaction-menu">
                                <button onClick={() => handleToggleReaction(msg.id, "❤️")} className="msg-reaction-btn">❤️</button>
                                <button onClick={() => handleToggleReaction(msg.id, "😆")} className="msg-reaction-btn">😆</button>
                              </div>
                            </div>

                            {msg.reactions_summary && Object.keys(msg.reactions_summary).length > 0 && (
                              <div className={`msg-reaction-summary ${isMe ? "msg-reaction-summary-me" : "msg-reaction-summary-other"}`}>
                                {Object.entries(msg.reactions_summary).map(([e, c]) => (
                                  <span key={e} className="flex items-center leading-none">{e} {c as number}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                {!isAtBottom && (
                  <div className="absolute bottom-4 right-6 z-50 flex flex-col items-end">
                    {showNewMessageAlert ? (
                      <Button
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg px-4 h-10 animate-bounce"
                        onClick={scrollToBottomAction}
                      >
                        Có tin nhắn mới <ArrowDown className="ml-1.5 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 w-10 h-10"
                        onClick={scrollToBottomAction}
                      >
                        <ArrowDown size={20} />
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="chat-empty">Hãy chọn một cuộc trò chuyện để bắt đầu</div>
            )}
          </div>

          {selectedContact && (
            <div className="chat-footer">
              <form onSubmit={handleSendText} className="chat-form">
                <Button type="button" variant="ghost" size="icon" className="toolbar-btn" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={22} />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="toolbar-btn" disabled={isUploading} onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon size={22} />
                </Button>
                
                <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className={`toolbar-btn ${showGifPicker ? 'toolbar-btn-active' : ''}`}>
                      <Sticker size={22} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-80 h-64 overflow-y-auto p-2" sideOffset={15}>
                    <div className="gif-grid">
                      {dummyGifs.map((gif, index) => (
                        <img key={index} src={gif} alt="gif" className="gif-item" onClick={() => handleSelectGif(gif)} />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="input-wrapper">
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Nhập tin nhắn..." className="chat-input" disabled={isUploading} />
                  <Button type="button" variant="ghost" className="smile-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <Smile size={22} />
                  </Button>
                  {showEmojiPicker && (
                    <div className="emoji-picker-container">
                      <EmojiPicker onEmojiClick={(o) => setNewMessage((p) => p + o.emoji)} theme={isDarkMode ? Theme.DARK : Theme.LIGHT} />
                    </div>
                  )}
                </div>
                
                <Button type="submit" variant="ghost" size="icon" className="submit-btn" disabled={isUploading}>
                  {newMessage.trim() ? <Send size={28} /> : <ThumbsUp size={30} />}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}