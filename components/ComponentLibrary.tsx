import React from 'react';
import type { DraggableComponent } from '../types';
import { HeadingIcon, ParagraphIcon, ButtonIcon, ImageIcon, ContainerIcon, LinkIcon, InputIcon, ListIcon, LayoutIcon, IconProps, NavigationIcon } from './Icons';

const components: (DraggableComponent & { icon: React.ReactElement<IconProps> })[] = [
    { id: 'heading', name: 'Heading', icon: <HeadingIcon />, html: '<h1 class="text-2xl font-bold my-4">New Heading</h1>' },
    { id: 'paragraph', name: 'Paragraph', icon: <ParagraphIcon />, html: '<p class="my-2">This is a new paragraph. You can edit this text.</p>' },
    { id: 'button', name: 'Button', icon: <ButtonIcon />, html: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2">Click Me</button>' },
    { id: 'image', name: 'Image', icon: <ImageIcon />, html: '<img src="https://via.placeholder.com/150" alt="placeholder image" class="my-2">' },
    { id: 'container', name: 'Container', icon: <ContainerIcon />, html: '<div class="p-4 border border-dashed my-2">\n  <!-- Drop other components here -->\n</div>' },
    { id: 'link', name: 'Link', icon: <LinkIcon />, html: '<a href="#" class="text-blue-600 hover:underline my-2">This is a link</a>' },
    { id: 'input', name: 'Input', icon: <InputIcon />, html: '<input type="text" placeholder="Enter text here..." class="border rounded p-2 my-2 w-full">' },
    { id: 'list', name: 'List', icon: <ListIcon />, html: '<ul class="list-disc list-inside my-2">\n  <li>List item 1</li>\n  <li>List item 2</li>\n</ul>' },
    {
        id: 'navbar',
        name: 'Nav Bar',
        icon: <NavigationIcon />,
        html: `<nav class="bg-gray-800 text-white p-4 flex justify-between items-center my-2 shadow-lg">
  <div class="font-bold text-xl"><a href="#">MySite</a></div>
  <div class="hidden md:flex items-center space-x-6">
    <a href="#" class="hover:text-gray-300 transition-colors">Home</a>
    <a href="#" class="hover:text-gray-300 transition-colors">About</a>
    <a href="#" class="hover:text-gray-300 transition-colors">Services</a>
  </div>
  <button class="hidden md:block bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors">Contact Us</button>
  <div class="md:hidden">
    <button class="focus:outline-none">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
    </button>
  </div>
</nav>`
    },
];

interface ComponentLibraryProps {
    onDragStart: () => void;
    onDragEnd: () => void;
}

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onDragStart, onDragEnd }) => {
    // A custom data type for our drag-and-drop payload
    const DATA_TYPE = 'application/vnd.live-dev-sandbox.component+json';

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, component: DraggableComponent) => {
        onDragStart();
        // Serialize the entire component object for transfer
        e.dataTransfer.setData(DATA_TYPE, JSON.stringify(component));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="grid grid-cols-2 gap-2">
            {components.map(component => {
                // Create a plain DraggableComponent object without the icon for transfer
                const draggableComponent: DraggableComponent = {
                    id: component.id,
                    name: component.name,
                    html: component.html,
                };
                return (
                    <div
                        key={component.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, draggableComponent)}
                        onDragEnd={onDragEnd}
                        className="flex flex-col items-center justify-center p-3 bg-black/20 hover:bg-black/40 rounded-md cursor-grab transition-all duration-200 border border-transparent hover:border-[var(--neon-pink)]"
                        title={`Drag to add ${component.name}`}
                    >
                        <div className="h-6 w-6 text-gray-300 mb-1">
                            {React.cloneElement(component.icon, { className: 'h-full w-full' })}
                        </div>
                        <p className="text-xs text-center text-gray-300">{component.name}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default ComponentLibrary;