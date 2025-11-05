import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNumber,
    IsObject,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateB2cMpesaTransactionDto {
    @ApiProperty({ example: 'NLJ41HAY6Q', description: 'M-PESA Transaction ID' })
    @IsOptional()
    @IsString()
    transaction_id?: string;

    @ApiProperty({
        example: 'AG_20191219_00004e48cf7e3533f581',
        description: 'M-PESA Conversation ID',
    })
    @IsOptional()
    @IsString()
    conversation_id?: string;

    @ApiProperty({
        example: '10571-7910404-1',
        description: 'Originator Conversation ID from your system',
    })
    @IsOptional()
    @IsString()
    originator_conversation_id?: string;

    @ApiProperty({ example: 0, description: 'Result type (0 for success)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    result_type?: number;

    @ApiProperty({ example: 0, description: 'Result code (0 for success)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    result_code?: number;

    @ApiProperty({
        example: 'The service request is processed successfully.',
        description: 'Description of the transaction result',
    })
    @IsOptional()
    @IsString()
    result_desc?: string;

    @ApiProperty({ example: 10.0, description: 'Transaction amount' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    transaction_amount?: number;

    @ApiProperty({
        example: '254708374149 - John Doe',
        description: 'Receiver party public name',
    })
    @IsOptional()
    @IsString()
    receiver_party_public_name?: string;

    @ApiProperty({
        example: '2019-12-19T11:45:50Z',
        description: 'Date and time when the transaction completed',
    })
    @IsOptional()
    @IsDateString()
    transaction_completed_at?: string;

    @ApiProperty({
        example: {
            Result: {
                ResultType: 0,
                ResultCode: 0,
                ResultDesc: 'Processed successfully',
            },
        },
        description: 'Full raw JSON response from M-PESA',
    })
    @IsOptional()
    @IsObject()
    raw_result?: Record<string, any>;
}
