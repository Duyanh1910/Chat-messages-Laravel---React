import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Camera, Sticker, Send, Smile, ImageIcon, MoreVertical, Paperclip, Search, Phone, Video, Sun, Moon, ThumbsUp, Edit, LogOut, Check, CheckCheck, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Virtuoso } from 'react-virtuoso';
import axios from 'axios';
import './App.css';

const currentUser = { id: 1, name: "Trần Long Nhật" };

const contacts = [
  { id: 2, name: "Trần Duy Anh", lastMsg: "Phần Laravel xong chưa ông?", time: "2 phút", avatar: "https://i.pravatar.cc/150?u=duyanh", online: true, unreadCount: 3 },
  { id: 3, name: "Vũ Quốc Pháp", lastMsg: "Check lại cái MQTT nhé.", time: "1 giờ", avatar: "https://i.pravatar.cc/150?u=phap", online: false, unreadCount: 0 },
  { id: 4, name: "Nhóm Đồ Án", lastMsg: "Tối nay họp nhóm nhé", time: "3 giờ", avatar: "https://i.pravatar.cc/150?u=group", online: true, unreadCount: 5 },
  { id: 5, name: "Nguyễn Văn A", lastMsg: "Ok bạn", time: "1 ngày", avatar: "https://i.pravatar.cc/150?u=a", online: false, unreadCount: 0 },
];

const initialMessages = [
  { id: 1, senderId: 2, text: "Alo Nhật ơi, cái phần website gốm sứ đến đâu rồi?", time: "09:00 AM", status: "read" },
  { id: 2, senderId: 1, text: "Đang làm giao diện Chat đây.", time: "09:05 AM", status: "read" },
  { id: 3, senderId: 2, text: "Ok, chốt làm giao diện trước nhé.", time: "09:06 AM", status: "read" },
];

const dummyGifs = [
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/yYSSBtDgbbRzq/giphy.gif",
  "https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif"
];

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  withCredentials: true, 
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export default function App() {
  const navigate = useNavigate(); 
  
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [activeTab, setActiveTab] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showWebcam, setShowWebcam] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'unread') return matchesSearch && contact.unreadCount > 0;
    if (activeTab === 'groups') return matchesSearch && contact.name.toLowerCase().includes("nhóm");
    return matchesSearch;
  });

  const sendMessage = (text: string, mediaUrl: string | null = null, mediaType: 'image' | 'file' | 'gif' | null = null, fileName: string = "") => {
    const newMsg = {
      id: messages.length + 1,
      senderId: currentUser.id,
      text: text,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      fileName: fileName,
      status: "sent",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const replyMsg = {
        id: messages.length + 2,
        senderId: selectedContact.id,
        text: "Mình đã nhận được tin nhắn nhé!",
        status: "read",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => {
        const updated = prev.map(msg => msg.senderId === currentUser.id ? { ...msg, status: 'read' } : msg);
        return [...updated, replyMsg];
      });
    }, 2500);
  };

  const handleSendText = (e?: React.SyntheticEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const messageText = newMessage.trim() ? newMessage : "👍";
    sendMessage(messageText);
    setNewMessage("");
    setShowEmojiPicker(false); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      if (file.type.startsWith("image/")) {
        sendMessage("", fileUrl, "image");
      } else {
        sendMessage(`Đã gửi file: ${file.name}`, fileUrl, "file", file.name);
      }
    }
  };

  const handleCameraClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      mobileCameraRef.current?.click();
    } else {
      startWebcam();
    }
  };

  const startWebcam = async () => {  
    try {
      setShowWebcam(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      alert("Không tìm thấy Webcam hoặc bạn chưa cấp quyền truy cập!");
      setShowWebcam(false);
    }
  };

  const closeWebcam = () => { 
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
  };

  const captureWebcam = () => { 
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const imageUrl = canvasRef.current.toDataURL('image/png');
      sendMessage("", imageUrl, "image");
      closeWebcam();
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleSelectGif = (gifUrl: string) => {
    sendMessage("", gifUrl, "gif");
    setShowGifPicker(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } finally {
      navigate('/login');
    }
  };

  const renderSidebarContent = () => (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold dark:text-white">Đoạn chat</h1>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="btn-action">
                  {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Giao diện {isDarkMode ? 'Sáng' : 'Tối'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="btn-action">
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tin nhắn mới</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="btn-action hover:text-red-500 dark:hover:text-red-400">
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Đăng xuất</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Tìm kiếm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border-none dark:text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-400 placeholder:text-zinc-500" 
          />
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="unread">Chưa đọc</TabsTrigger>
            <TabsTrigger value="groups">Nhóm</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ScrollArea className="flex-1">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div key={contact.id} onClick={() => setSelectedContact(contact)} className={`contact-item ${selectedContact.id === contact.id ? "contact-item-active" : ""}`}>
              <div className="relative">
                <Avatar className="h-12 w-12"><AvatarImage src={contact.avatar} /><AvatarFallback>{contact.name.charAt(0)}</AvatarFallback></Avatar>
                {contact.online && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 bg-green-500"></span>}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-semibold text-[15px] truncate dark:text-zinc-100">{contact.name}</span>
                </div>
                <div className="flex items-center justify-between text-[13px] text-zinc-500">
                  <p className="truncate flex-1 pr-2">{contact.lastMsg}</p>
                  {contact.unreadCount > 0 ? (
                    <Badge variant="destructive" className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                      {contact.unreadCount}
                    </Badge>
                  ) : (
                    <span className="shrink-0 text-[11px]">{contact.time}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Không tìm thấy kết quả nào.
          </div>
        )}
      </ScrollArea>
    </>
  );

  return (
    <TooltipProvider>
      <div className="app-wrapper">
        
        <Dialog open={showWebcam} onOpenChange={(open) => { if (!open) closeWebcam(); }}>
          <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Chụp ảnh bằng Webcam</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <video ref={videoRef} autoPlay playsInline className="rounded-lg w-full bg-black shadow-inner border border-zinc-700" />
              <canvas ref={canvasRef} className="hidden" />
              <Button onClick={captureWebcam} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 font-bold shadow-lg">
                <Camera className="h-6 w-6 mr-2" /> Chụp ngay
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileChange} className="hidden" />
        <input type="file" accept="image/*" capture="environment" ref={mobileCameraRef} onChange={handleFileChange} className="hidden" />

        <div className="sidebar">
          {renderSidebarContent()}
        </div>

        <div className="chat-container">
          <div className="flex items-center justify-between border-b shadow-sm dark:border-zinc-800 p-3 h-[76px]">
            <div className="flex items-center gap-3">
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5 dark:text-white" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px] flex flex-col bg-white dark:bg-zinc-900 border-r dark:border-zinc-800">
                  {renderSidebarContent()}
                </SheetContent>
              </Sheet>

              <Avatar className="h-10 w-10"><AvatarImage src={selectedContact.avatar} /><AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback></Avatar>
              <div className="flex flex-col">
                <h2 className="font-semibold text-[15px] leading-tight dark:text-zinc-100">{selectedContact.name}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedContact.online ? "Đang hoạt động" : "Ngoại tuyến"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="btn-icon"><Phone className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="btn-icon"><Video className="h-5 w-5" /></Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="btn-icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>Xem trang cá nhân</DropdownMenuItem>
                  <DropdownMenuItem>Tắt thông báo</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">Chặn người dùng</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/50" onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); }}>
            <Virtuoso
              style={{ height: '100%' }}
              data={messages}
              initialTopMostItemIndex={messages.length - 1}
              followOutput="smooth"
              itemContent={(_index, msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div className={`flex w-full px-4 py-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[65%] flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                      {msg.mediaType === 'image' ? (
                        <div className="rounded-2xl overflow-hidden border dark:border-zinc-800 max-w-[300px]">
                           <img src={msg.mediaUrl} alt="sent image" className="w-full h-auto object-cover" />
                        </div>
                      ) : msg.mediaType === 'gif' ? (
                        <div className="rounded-2xl overflow-hidden max-w-[250px]">
                           <img src={msg.mediaUrl} alt="sent gif" className="w-full h-auto object-cover" />
                        </div>
                      ) : msg.mediaType === 'file' ? (
                         <div className={`rounded-2xl px-4 py-3 flex items-center gap-2 ${isMe ? "msg-file-me" : "msg-file-other"}`}>
                           <Paperclip className="h-5 w-5 shrink-0" />
                           <span className="text-sm underline break-all">{msg.text}</span>
                         </div>
                      ) : msg.text === "👍" ? (
                        <div className="text-4xl pr-2">{msg.text}</div>
                      ) : (
                        <div className={isMe ? "msg-bubble-me" : "msg-bubble-other"}>
                          {msg.text}
                        </div>
                      )}

                      <div className="flex items-center gap-1 mx-1">
                        <span className="text-[11px] font-medium text-zinc-400">{msg.time}</span>
                        {isMe && msg.status === "sent" && <Check className="w-3 h-3 text-zinc-400" />}
                        {isMe && msg.status === "read" && <CheckCheck className="w-3 h-3 text-blue-500" />}
                      </div>
                    </div>
                  </div>
                );
              }}
              components={{
                Footer: () => (
                  <div className="px-4 py-2 h-16">
                    {isTyping && (
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    )}
                  </div>
                )
              }}
            />
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <div className="flex items-center gap-1"> 
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="btn-icon">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Đính kèm file</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" onClick={handleCameraClick} variant="ghost" size="icon" className="btn-icon">
                      <Camera className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chụp ảnh</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" onClick={() => imageInputRef.current?.click()} variant="ghost" size="icon" className="btn-icon">
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Đính kèm ảnh</TooltipContent>
                </Tooltip>

                <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className={`btn-icon ${showGifPicker ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}>
                          <Sticker className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Gửi GIF</TooltipContent>
                  </Tooltip>
                  <PopoverContent side="top" align="start" className="w-80 h-64 overflow-y-auto p-2" sideOffset={15}>
                    <div className="grid grid-cols-2 gap-2">
                      {dummyGifs.map((gif, index) => (
                        <img 
                          key={index} 
                          src={gif} 
                          alt="gif" 
                          className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleSelectGif(gif)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

              </div>

              <div className="relative flex-1 flex items-center">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Aa" 
                  className="chat-input"
                />
                
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className={`absolute right-1 text-blue-500 hover:bg-transparent hover:text-blue-600 rounded-full ${showEmojiPicker ? 'text-blue-700' : ''}`}
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="end" className="p-0 border-none shadow-xl bg-transparent" sideOffset={15}>
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                      searchDisabled={false}
                      skinTonesDisabled={true}
                    />
                  </PopoverContent>
                </Popover>

              </div>

              <Button type="submit" size="icon" className="rounded-full h-10 w-10 bg-transparent text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 shadow-none transition-all">
                {newMessage.trim() ? <Send className="h-6 w-6" /> : <ThumbsUp className="h-6 w-6" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}