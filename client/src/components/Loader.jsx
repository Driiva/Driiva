import { Skeleton, SkeletonItem, Title3 } from "@fluentui/react-components"

const Loader = () => (
    <Skeleton className="flex flex-col flex-1 container mx-auto my-8 text-center items-center" animation='pulse'>
        <SkeletonItem shape="circle" size={16} className="mr-2" />
        <SkeletonItem shape="rectangle" size={80} className='mb-8' />

        <SkeletonItem shape="rectangle" size={40} className="text-2xl font-bold mb-8" />
        <div className="my-8 p-8 bg-white rounded-md shadow-md max-w-md w-full mx-auto">
            <Title3 className="ml-4">Loading...</Title3>
            <SkeletonItem shape='rectangle' size={12} animation='wave' className='mt-8' />
        </div>
        <SkeletonItem shape="rectangle" size={128} className='mb-8' />
        <SkeletonItem shape="rectangle" size={32} className='mb-8' />
        <SkeletonItem shape="rectangle" size={40} className="mb-8" />

        <SkeletonItem shape="rectangle" size={16} className='ml-2 mb-8' />
    </Skeleton>
);

export default Loader;